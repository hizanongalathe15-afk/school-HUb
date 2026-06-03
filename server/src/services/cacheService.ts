import { createClient, RedisClientType } from 'redis';
import { getRedisStatus } from '../config/redis.js';

let redisClient: RedisClientType | null = null;

export async function connectRedis() {
  const redisStatus = getRedisStatus();
  
  if (!redisStatus.enabled) {
    console.log('Redis is disabled');
    return null;
  }
  
  try {
    redisClient = createClient({
      url: redisStatus.urlConfigured ? process.env.REDIS_URL : 'redis://localhost:6379'
    });
    
    redisClient.on('error', (err) => {
      console.log('Redis Client Error', err);
    });
    
    await redisClient.connect();
    console.log('Connected to Redis');
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
}

export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Disconnected from Redis');
  }
}

// Cache wrapper functions
export class CacheService {
  private readonly DEFAULT_TTL = 3600; // 1 hour

  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client || !client.isOpen) return null;
    
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = this.DEFAULT_TTL): Promise<boolean> {
    const client = getRedisClient();
    if (!client || !client.isOpen) return false;
    
    try {
      await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return true;
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client || !client.isOpen) return false;
    
    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`Redis del error for key ${key}:`, error);
      return false;
    }
  }

  async hashGet<T>(hashKey: string, field: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client || !client.isOpen) return null;
    
    try {
      const value = await client.hGet(hashKey, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis hashGet error for hash ${hashKey}, field ${field}:`, error);
      return null;
    }
  }

  async hashSet<T>(hashKey: string, field: string, value: T, ttlSeconds: number = this.DEFAULT_TTL): Promise<boolean> {
    const client = getRedisClient();
    if (!client || !client.isOpen) return false;
    
    try {
      await client.hSet(hashKey, field, JSON.stringify(value));
      // Note: Redis doesn't have built-in TTL for hash fields, we'd need to handle expiration separately
      return true;
    } catch (error) {
      console.error(`Redis hashSet error for hash ${hashKey}, field ${field}:`, error);
      return false;
    }
  }

  async hashDel(hashKey: string, field: string): Promise<boolean> {
    const client = getRedisClient();
    if (!client || !client.isOpen) return false;
    
    try {
      await client.hDel(hashKey, field);
      return true;
    } catch (error) {
      console.error(`Redis hashDel error for hash ${hashKey}, field ${field}:`, error);
      return false;
    }
  }
}

export const cacheService = new CacheService();
