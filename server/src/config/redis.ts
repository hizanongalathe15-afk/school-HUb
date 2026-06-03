export interface RedisConfig {
  url: string;
  enabled: boolean;
}

export const redisConfig: RedisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  enabled: process.env.REDIS_ENABLED === 'true'
};

export function getRedisStatus() {
  return {
    provider: 'redis',
    enabled: redisConfig.enabled,
    urlConfigured: Boolean(redisConfig.url)
  };
}
