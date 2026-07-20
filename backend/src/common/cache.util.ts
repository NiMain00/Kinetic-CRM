export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

export class SimpleCache {
  private store = new Map<string, CacheEntry>();

  constructor(private defaultTtlMs: number = 30_000) {}

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
  }

  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.store.get(key);
    const effectiveTtl = ttlMs ?? this.defaultTtlMs;
    if (cached && Date.now() - cached.timestamp < effectiveTtl) {
      return cached.data as T;
    }
    const data = await fetchFn();
    this.store.set(key, { data, timestamp: Date.now() });
    return data;
  }

  invalidate(key?: string): void {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }
}

export const authCache = new SimpleCache(30_000);
export const configCache = new SimpleCache(60_000);
export const rbacCache = new SimpleCache(60_000);
