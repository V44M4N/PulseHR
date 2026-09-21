import { createClient } from 'redis';
import { env } from './env';

export const redis = createClient({ url: env.REDIS_URL });

redis.on('error', (err) => console.error('Redis error:', err));

export async function connectRedis(): Promise<void> {
  await redis.connect();
  console.log('✅  Redis connected');
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export async function setEx(key: string, ttlSeconds: number, value: string): Promise<void> {
  await redis.setEx(key, ttlSeconds, value);
}

export async function get(key: string): Promise<string | null> {
  return redis.get(key);
}

export async function del(key: string): Promise<void> {
  await redis.del(key);
}

/** Cache a JSON value with optional TTL */
export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  await redis.setEx(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}
