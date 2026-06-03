import http from 'http';
import './config/env.js';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { WebSocketService } from './services/websocketService.js';
// Existing background job service is JavaScript; keep using it without forcing a rewrite.
// @ts-ignore
import { BackgroundJobService } from './services/backgroundJobService.ts';
import { connectRedis } from './services/cacheService.js';

const START_PORT = Number(process.env.PORT || 5000);
const MAX_PORT_ATTEMPTS = 20;

function listenWithFallback(port: number, attempt = 0) {
  const candidate = http.createServer(app);

  candidate.once('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is in use. Trying ${nextPort}...`);
      candidate.close();
      listenWithFallback(nextPort, attempt + 1);
      return;
    }

    console.error('Server failed to start:', error);
    process.exit(1);
  });

  candidate.listen(port, () => {
    server = candidate;
    console.log(`Server running on port ${port}`);
    console.log('Database connection verified');
    
    // Initialize Redis connection
    connectRedis().then(() => {
      console.log('Redis connection initialized');
    }).catch((error) => {
      console.warn('Redis connection failed, continuing without cache:', error);
    });
    
    // Initialize WebSocket service
    WebSocketService.initialize(candidate);
    console.log('WebSocket service initialized');
    
    // Initialize background job service
    new BackgroundJobService();
    console.log('Background job service initialized');
  });

  return candidate;
}

let server: http.Server | null = null;

connectDatabase()
  .then(() => {
    server = listenWithFallback(START_PORT);
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

export default server;
