import { Redis } from '@upstash/redis';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

function createRedisClient(): Redis | null {
  const url = process.env.KV_URL || process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
  if (url && token) {
    try {
      return new Redis({ url, token });
    } catch {
      return null;
    }
  }
  return null;
}

const globalRedis = createRedisClient();

export class SimpleCache {
  private store = new Map<string, CacheEntry>();
  private readonly redis: Redis | null;
  private readonly redisPrefix: string;

  constructor(private defaultTtlMs: number = 30_000, redisPrefix = 'cache') {
    this.redis = globalRedis;
    this.redisPrefix = redisPrefix;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (entry && Date.now() - entry.timestamp < this.defaultTtlMs) {
      return entry.data as T;
    }
    if (entry) this.store.delete(key);
    return undefined;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
    if (this.redis) {
      const redisKey = `${this.redisPrefix}:${key}`;
      this.redis.set(redisKey, { data, timestamp: Date.now() }, { ex: Math.ceil(this.defaultTtlMs / 1000) }).catch(() => {});
    }
  }

  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlMs?: number): Promise<T> {
    const effectiveTtl = ttlMs ?? this.defaultTtlMs;

    // Check local in-memory cache first
    const local = this.store.get(key);
    if (local && Date.now() - local.timestamp < effectiveTtl) {
      return local.data as T;
    }
    if (local) this.store.delete(key);

    // Check Redis if available
    if (this.redis) {
      try {
        const redisKey = `${this.redisPrefix}:${key}`;
        const remote = await this.redis.get<CacheEntry>(redisKey);
        if (remote && Date.now() - remote.timestamp < effectiveTtl) {
          this.store.set(key, { data: remote.data, timestamp: remote.timestamp });
          return remote.data as T;
        }
      } catch {
        // Redis unavailable, fall through
      }
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Store locally
    this.store.set(key, { data, timestamp: Date.now() });

    // Persist to Redis if available
    if (this.redis) {
      const redisKey = `${this.redisPrefix}:${key}`;
      this.redis.set(redisKey, { data, timestamp: Date.now() }, { ex: Math.ceil(effectiveTtl / 1000) }).catch(() => {});
    }

    return data;
  }

  invalidate(key?: string): void {
    if (key) {
      this.store.delete(key);
      if (this.redis) {
        const redisKey = `${this.redisPrefix}:${key}`;
        this.redis.del(redisKey).catch(() => {});
      }
    } else {
      this.store.clear();
      // Can't flush all prefixed keys without scan — skip for full invalidation
    }
  }
}

export const authCache = new SimpleCache(30_000, 'auth');
export const configCache = new SimpleCache(60_000, 'config');
export const rbacCache = new SimpleCache(60_000, 'rbac');
