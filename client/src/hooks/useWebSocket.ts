import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

export interface WebSocketMessage {
  type: string;
  data: any;
  userId?: string;
  roomId?: string;
  timestamp?: string;
}

export interface WebSocketEventHandlers {
  onMessage?: (message: WebSocketMessage) => void;
  onConnection?: (data: any) => void;
  onError?: (error: Error) => void;
  onClose?: (event: CloseEvent) => void;
}

type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface UseWebSocketReturn {
  ready: boolean;
  status: WebSocketStatus;
  send: (type: string, data: any, roomId?: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  broadcast: (type: string, data: any) => void;
  records: WebSocketMessage[];
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  getUserCount: () => number;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;

let wsInstance: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;
const messageQueue: { type: string; data: any; roomId?: string }[] = [];
const listeners = new Set<(message: WebSocketMessage) => void>();
let connectionStatus: WebSocketStatus = 'disconnected';
let userCount = 0;

// Status listeners for UI updates
const statusListeners = new Set<(status: WebSocketStatus) => void>();

function notifyStatusListeners(status: WebSocketStatus) {
  connectionStatus = status;
  statusListeners.forEach(listener => listener(status));
}

function processQueue() {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    while (messageQueue.length > 0) {
      const message = messageQueue.shift();
      if (message) {
        wsInstance.send(JSON.stringify(message));
      }
    }
  }
}

export function useWebSocket(handlers?: WebSocketEventHandlers): UseWebSocketReturn {
  const { token, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [records, setRecords] = useState<WebSocketMessage[]>([]);
  const messageHandlerRef = useRef(handlers?.onMessage);
  const connectionHandlerRef = useRef(handlers?.onConnection);

  // Update refs when handlers change
  useEffect(() => {
    messageHandlerRef.current = handlers?.onMessage;
    connectionHandlerRef.current = handlers?.onConnection;
  }, [handlers]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    // Store message in records
    setRecords(prev => [...prev.slice(-99), message]); // Keep last 100 messages

    // Call registered handler
    messageHandlerRef.current?.(message);

    // Notify all listeners
    listeners.forEach(listener => listener(message));

    // Handle specific message types for notifications
    switch (message.type) {
      case 'message:new':
        addNotification({
          message: message.data.message || 'You have a new message',
          type: 'info'
        });
        break;

      case 'attendance:marked':
        addNotification({
          message: message.data.message || 'Attendance has been marked',
          type: 'info'
        });
        break;

      case 'result:published':
        addNotification({
          message: message.data.message || 'New results have been published',
          type: 'success'
        });
        break;

      case 'fee:paid':
        addNotification({
          message: message.data.message || 'A fee payment has been received',
          type: 'success'
        });
        break;

      case 'announcement:new':
        addNotification({
          message: message.data.message || 'New school announcement',
          type: 'info'
        });
        break;

      case 'connection':
        connectionHandlerRef.current?.(message.data);
        break;
    }
  }, [addNotification]);

  const connect = useCallback(() => {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (!token) {
      notifyStatusListeners('disconnected');
      return;
    }

    notifyStatusListeners('connecting');
    setStatus('connecting');

    try {
      // Construct WebSocket URL with token
      const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`;
      wsInstance = new WebSocket(wsUrl);

      wsInstance.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts = 0;
        notifyStatusListeners('connected');
        setStatus('connected');
        setError(null);
        processQueue();
      };

      wsInstance.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsInstance.onerror = (event) => {
        console.error('WebSocket error:', event);
        const error = new Error('WebSocket connection error');
        setError(error);
        notifyStatusListeners('disconnected');
        setStatus('disconnected');
      };

      wsInstance.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        notifyStatusListeners('disconnected');
        setStatus('disconnected');

        // Attempt to reconnect
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          notifyStatusListeners('reconnecting');
          setStatus('reconnecting');
          reconnectTimeout = setTimeout(() => {
            connect();
          }, RECONNECT_INTERVAL);
        }
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError(err as Error);
      notifyStatusListeners('disconnected');
      setStatus('disconnected');
    }
  }, [token, handleMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect

    if (wsInstance) {
      wsInstance.close(1000, 'User disconnected');
      wsInstance = null;
    }

    notifyStatusListeners('disconnected');
    setStatus('disconnected');
  }, []);

  const send = useCallback((type: string, data: any, roomId?: string) => {
    const message = { type, data, roomId };

    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      wsInstance.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      messageQueue.push(message);
    }
  }, []);

  const broadcast = useCallback((type: string, data: any) => {
    send(type, data);
  }, [send]);

  const joinRoom = useCallback((roomId: string) => {
    send('join_room', { roomId });
  }, [send]);

  const leaveRoom = useCallback((roomId: string) => {
    send('leave_room', { roomId });
  }, [send]);

  const getUserCount = useCallback(() => {
    return userCount;
  }, []);

  // Auto-connect when token becomes available
  useEffect(() => {
    if (token && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, user?.id, connect, disconnect]);

  // Subscribe to status updates
  useEffect(() => {
    const handleStatusChange = (newStatus: WebSocketStatus) => {
      setStatus(newStatus);
    };

    statusListeners.add(handleStatusChange);
    return () => {
      statusListeners.delete(handleStatusChange);
    };
  }, []);

  // Add message listener
  useEffect(() => {
    listeners.add(handleMessage);
    return () => {
      listeners.delete(handleMessage);
    };
  }, [handleMessage]);

  return {
    ready: status === 'connected',
    status,
    send,
    joinRoom,
    leaveRoom,
    broadcast,
    records,
    error,
    connect,
    disconnect,
    getUserCount
  };
}

// Export utility functions for use outside of React components
export const websocketUtils = {
  isConnected: () => connectionStatus === 'connected',
  getStatus: () => connectionStatus,
  send: (type: string, data: any, roomId?: string) => {
    const message = { type, data, roomId };
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      wsInstance.send(JSON.stringify(message));
    } else {
      messageQueue.push(message);
    }
  },
  addListener: (listener: (message: WebSocketMessage) => void) => {
    listeners.add(listener);
  },
  removeListener: (listener: (message: WebSocketMessage) => void) => {
    listeners.delete(listener);
  }
};

export default useWebSocket;