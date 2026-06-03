import { WebSocketServer, WebSocket } from 'ws';
import { prisma } from '../config/database.js';
import { getRedisStatus } from '../config/redis.js';
import { eventEmitter } from './eventEmitterService.js';
import { getRedisClient } from './cacheService.js';

interface WebSocketMessage {
  type: string;
  data: any;
  userId?: string;
  roomId?: string;
}

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  role: string;
  rooms: Set<string>;
}

interface HeartbeatWebSocket extends WebSocket {
  isAlive?: boolean;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private redisSubscriber: ReturnType<typeof getRedisClient> | null = null;
  private redisPublisher: ReturnType<typeof getRedisClient> | null = null;

  private constructor(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.initialize();
    this.setupEventListeners();
    this.setupRedisPubSub();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      throw new Error('WebSocketService not initialized. Call initialize first.');
    }
    return WebSocketService.instance;
  }

  public static initialize(server: any): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService(server);
    }
    return WebSocketService.instance;
  }

  private async verifyClient(info: any, cb: (result: boolean, code?: number, message?: string) => void) {
    try {
      // Extract token from headers or query params
      const token = info.req.headers['authorization']?.split(' ')[1] || 
                   new URL(info.req.url, `http://${info.req.headers.host}`).searchParams.get('token');

      if (!token) {
        cb(false, 401, 'Unauthorized: No token provided');
        return;
      }

      // Verify JWT token (simplified - in production use proper JWT verification)
      // For now, we'll accept any token and extract user info from it
      // In a real implementation, you would verify the JWT signature
      const userInfo = this.decodeToken(token);
      
      if (!userInfo) {
        cb(false, 401, 'Unauthorized: Invalid token');
        return;
      }

      // Attach user info to request for use in connection
      info.req.user = userInfo;
      cb(true);
    } catch (error) {
      console.error('WebSocket verification error:', error);
      cb(false, 401, 'Unauthorized: Token verification failed');
    }
  }

  private decodeToken(token: string): { userId: string; role: string } | null {
    try {
      // In a real implementation, verify JWT signature and decode
      // For simplicity, we're assuming a base64 encoded JSON payload
      // This is NOT secure for production - use proper JWT library
      const payload = token.split('.')[1];
      if (!payload) return null;
      
      const decoded = Buffer.from(payload, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const userId = req.user?.userId;
      const role = req.user?.role;
      
      if (!userId || !role) {
        ws.close(4001, 'Invalid user info');
        return;
      }

      const client: ConnectedClient = {
        ws,
        userId,
        role,
        rooms: new Set()
      };

      this.clients.set(userId, client);
      console.log(`WebSocket client connected: ${userId} (${role})`);

      // Send welcome message
      this.sendToUser(userId, {
        type: 'connection',
        data: { message: 'Connected to School Hub WebSocket server' }
      });

      // Handle incoming messages
      ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleMessage(client, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Invalid message format' }
          }));
        }
      });

      // Handle connection close
      ws.on('close', (code: number, reason: Buffer) => {
        console.log(`WebSocket client disconnected: ${userId} (code: ${code})`);
        this.clients.delete(userId);
      });

      // Handle connection errors
      ws.on('error', (error: Error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        this.clients.delete(userId);
      });

      // Start heartbeat to detect disconnected clients
      (ws as HeartbeatWebSocket).isAlive = true;
      ws.on('pong', () => {
        (ws as HeartbeatWebSocket).isAlive = true;
      });
    });

    // Start heartbeat interval to detect dead connections
    setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const heartbeatSocket = ws as HeartbeatWebSocket;
        if (!heartbeatSocket.isAlive) return heartbeatSocket.terminate();
        
        heartbeatSocket.isAlive = false;
        heartbeatSocket.ping();
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  private setupEventListeners() {
    // Listen for events from the event emitter and broadcast via WebSocket
    eventEmitter.on('message:new', (data) => {
      // Send to receiver if online
      this.sendToUser(data.receiverId, {
        type: 'message:new',
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      });
      
      // Also send to sender for confirmation/echo
      this.sendToUser(data.senderId, {
        type: 'message:sent',
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      });
    });

    eventEmitter.on('attendance:marked', (data) => {
      // This would be sent to parents of the student and teacher of the class
      // For simplicity, we're broadcasting to a class-specific room
      this.sendToRoom(`class:${data.classId}`, {
        type: 'attendance:marked',
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      });
    });

    eventEmitter.on('result:published', (data) => {
      this.sendToRoom(`class:${data.classId}`, {
        type: 'result:published',
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      });
    });

    eventEmitter.on('fee:paid', (data) => {
      // In a real app, you'd fetch parent IDs associated with the student
      // For now, we'll broadcast to a general payments room
      this.sendToRoom('payments', {
        type: 'fee:paid',
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      });
    });

    eventEmitter.on('announcement:new', (data) => {
      let room: string;
      switch (data.audience) {
        case 'all':
          room = 'all';
          break;
        case 'parents':
          room = 'parents';
          break;
        case 'teachers':
          room = 'teachers';
          break;
        case 'staff':
          room = 'staff';
          break;
        default:
          room = data.audience;
      }
      
      this.sendToRoom(room, {
        type: 'announcement:new',
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      });
    });
  }

  private setupRedisPubSub() {
    const redisStatus = getRedisStatus();
    if (!redisStatus.enabled) {
      console.log('Redis is disabled, skipping Redis pub/sub setup');
      return;
    }

    try {
      // Create publisher and subscriber clients
      this.redisPublisher = getRedisClient();
      this.redisSubscriber = getRedisClient();

      if (!this.redisPublisher || !this.redisSubscriber) {
        console.warn('Redis clients not available, skipping pub/sub setup');
        return;
      }

      // Subscribe to the websocket_events channel
      this.redisSubscriber.subscribe('websocket_events', (message) => {
        try {
          const parsed = JSON.parse(message);
          this.handleRedisMessage(parsed);
        } catch (error) {
          console.error('Error parsing Redis message:', error);
        }
      });

      console.log('Redis pub/sub setup completed');
    } catch (error) {
      console.error('Error setting up Redis pub/sub:', error);
    }
  }

  private handleRedisMessage(message: any) {
    // Forward Redis messages to local WebSocket clients
    // This enables cross-instance communication
    if (message.type && message.data) {
      // Broadcast to appropriate users/rooms based on message content
      if (message.data.userId) {
        // Send to specific user
        this.sendToUser(message.data.userId, {
          type: message.type,
          data: message.data
        });
      } else if (message.data.roomId) {
        // Send to specific room
        this.sendToRoom(message.data.roomId, {
          type: message.type,
          data: message.data
        });
      } else {
        // Broadcast to all
        this.broadcast({
          type: message.type,
          data: message.data
        });
      }
    }
  }

  private handleMessage(client: ConnectedClient, message: WebSocketMessage) {
    switch (message.type) {
      case 'join_room':
        if (message.data.roomId) {
          client.rooms.add(message.data.roomId);
          this.sendToUser(client.userId, {
            type: 'room_joined',
            data: { roomId: message.data.roomId }
          });
        }
        break;
        
      case 'leave_room':
        if (message.data.roomId) {
          client.rooms.delete(message.data.roomId);
          this.sendToUser(client.userId, {
            type: 'room_left',
            data: { roomId: message.data.roomId }
          });
        }
        break;
        
      case 'ping':
        this.sendToUser(client.userId, {
          type: 'pong',
          data: { timestamp: Date.now() }
        });
        break;
        
      default:
        // Forward to appropriate handler based on type
        this.forwardMessageToHandlers(client, message);
        break;
    }
  }

  private forwardMessageToHandlers(client: ConnectedClient, message: WebSocketMessage) {
    // In a more sophisticated implementation, this would route to specific handlers
    // based on message type (chat, attendance, grades, etc.)
    // For now, we'll broadcast to room if specified
    if (message.roomId) {
      this.sendToRoom(message.roomId, {
        type: message.type,
        data: {
          ...message.data,
          senderId: client.userId,
          senderRole: client.role
        }
      }, client.userId); // Don't send back to sender
      
      // Also publish to Redis for other instances
      this.publishToRedis({
        type: message.type,
        data: {
          ...message.data,
          senderId: client.userId,
          senderRole: client.role
        }
      });
    } else {
      // Broadcast to all connected users (use sparingly)
      this.broadcast({
        type: message.type,
        data: {
          ...message.data,
          senderId: client.userId,
          senderRole: client.role
        }
      }, client.userId);
      
      // Also publish to Redis for other instances
      this.publishToRedis({
        type: message.type,
        data: {
          ...message.data,
          senderId: client.userId,
          senderRole: client.role
        }
      });
    }
  }

  private publishToRedis(message: any) {
    if (!this.redisPublisher || !this.redisPublisher.isOpen) {
      return;
    }
    
    try {
      this.redisPublisher.publish('websocket_events', JSON.stringify(message));
    } catch (error) {
      console.error('Error publishing to Redis:', error);
    }
  }

  sendToUser(userId: string, message: WebSocketMessage) {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  sendToRoom(roomId: string, message: WebSocketMessage, excludeUserId?: string) {
    let sentCount = 0;
    for (const [userId, client] of this.clients.entries()) {
      if (excludeUserId && userId === excludeUserId) continue;
      if (client.rooms.has(roomId) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
        sentCount++;
      }
    }
    return sentCount;
  }

  broadcast(message: WebSocketMessage, excludeUserId?: string) {
    let sentCount = 0;
    for (const [userId, client] of this.clients.entries()) {
      if (excludeUserId && userId === excludeUserId) continue;
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
        sentCount++;
      }
    }
    return sentCount;
  }

  getConnectedUsers(): Array<{ userId: string; role: string; rooms: string[] }> {
    return Array.from(this.clients.entries()).map(([userId, client]) => ({
      userId,
      role: client.role,
      rooms: Array.from(client.rooms)
    }));
  }

  getUserCount(): number {
    return this.clients.size;
  }

  shutdown() {
    // Close Redis connections
    if (this.redisPublisher) {
      this.redisPublisher.quit();
    }
    if (this.redisSubscriber) {
      this.redisSubscriber.quit();
    }
    
    // Close WebSocket connections
    this.wss.clients.forEach((ws: WebSocket) => {
      ws.close(1001, 'Server shutting down');
    });
    this.wss.close();
  }
}
