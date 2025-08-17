import { NextRequest, NextResponse } from 'next/server';
import { AppError } from './errorHandler';

// Cache types
export enum CacheType {
  MEMORY = 'memory',
  REDIS = 'redis',
  FILE = 'file',
  HTTP = 'http'
}

// Cache entry interface
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt: number;
  tags: string[];
  metadata: {
    size: number;
    hits: number;
    lastAccessed: number;
    createdAt: number;
  };
}

// Cache configuration interface
export interface CacheConfig {
  type: CacheType;
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes
  maxEntries?: number; // Maximum number of entries
  tags?: string[]; // Default tags for entries
  compression?: boolean; // Enable compression
  namespace?: string; // Cache namespace
}

// Cache invalidation options
export interface InvalidationOptions {
  tags?: string[];
  pattern?: string | RegExp;
  before?: Date;
  after?: Date;
}

// Cache statistics
export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  oldestEntry: number;
  newestEntry: number;
  tags: Record<string, number>;
}

// Default cache configuration
export const defaultCacheConfig: CacheConfig = {
  type: CacheType.MEMORY,
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100 * 1024 * 1024, // 100MB
  maxEntries: 1000,
  compression: false,
  namespace: 'default'
};

// In-memory cache implementation
class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  constructor(private config: CacheConfig) {}

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.metadata.hits++;
    entry.metadata.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.value;
  }

  async set<T>(key: string, value: T, ttl?: number, tags: string[] = []): Promise<void> {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.ttl);

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      expiresAt,
      tags: [...(this.config.tags || []), ...tags],
      metadata: {
        size: this.calculateSize(value),
        hits: 0,
        lastAccessed: now,
        createdAt: now
      }
    };

    // Check size limits
    if (this.config.maxSize && this.getTotalSize() + entry.metadata.size > this.config.maxSize) {
      this.evictEntries();
    }

    // Check entry limits
    if (this.config.maxEntries && this.cache.size >= this.config.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async invalidate(options: InvalidationOptions = {}): Promise<number> {
    let deletedCount = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      let shouldDelete = false;

      // Check tags
      if (options.tags && options.tags.some(tag => entry.tags.includes(tag))) {
        shouldDelete = true;
      }

      // Check pattern
      if (options.pattern) {
        const pattern = typeof options.pattern === 'string'
          ? new RegExp(options.pattern)
          : options.pattern;
        if (pattern.test(key)) {
          shouldDelete = true;
        }
      }

      // Check date range
      if (options.before && entry.timestamp > options.before.getTime()) {
        shouldDelete = true;
      }
      if (options.after && entry.timestamp < options.after.getTime()) {
        shouldDelete = true;
      }

      if (shouldDelete) {
        keysToDelete.push(key);
      }
    }

    // Delete matching entries
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      deletedCount++;
    });

    return deletedCount;
  }

  async getStats(): Promise<CacheStats> {
    const entries = Array.from(this.cache.values());
    const tags: Record<string, number> = {};

    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    });

    return {
      totalEntries: this.cache.size,
      totalSize: this.getTotalSize(),
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses),
      evictions: this.stats.evictions,
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      newestEntry: Math.max(...entries.map(e => e.timestamp)),
      tags
    };
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length;
  }

  private getTotalSize(): number {
    return Array.from(this.cache.values()).reduce((total, entry) => total + entry.metadata.size, 0);
  }

  private evictEntries(): void {
    // Simple LRU eviction - remove oldest entries
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.metadata.lastAccessed - b.metadata.lastAccessed);

    while (this.getTotalSize() > (this.config.maxSize || 0) && entries.length > 0) {
      const [key] = entries.shift()!;
      this.cache.delete(key);
      this.stats.evictions++;
    }
  }

  private evictOldest(): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.metadata.lastAccessed - b.metadata.lastAccessed);

    if (entries.length > 0) {
      const [key] = entries[0];
      this.cache.delete(key);
      this.stats.evictions++;
    }
  }
}

// HTTP cache implementation
class HttpCache {
  constructor(private config: CacheConfig) {}

  async get<T>(key: string): Promise<T | null> {
    // This would implement HTTP caching logic
    // For now, return null to indicate cache miss
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number, tags: string[] = []): Promise<void> {
    // This would implement HTTP caching logic
  }

  async delete(key: string): Promise<boolean> {
    return true;
  }

  async clear(): Promise<void> {
    // Clear HTTP cache
  }

  async invalidate(options: InvalidationOptions = {}): Promise<number> {
    return 0;
  }

  async getStats(): Promise<CacheStats> {
    return {
      totalEntries: 0,
      totalSize: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
      oldestEntry: 0,
      newestEntry: 0,
      tags: {}
    };
  }
}

// Main cache handler class
export class CacheHandler {
  private cache: MemoryCache | HttpCache;
  private config: CacheConfig;

  constructor(config: CacheConfig = defaultCacheConfig) {
    this.config = { ...defaultCacheConfig, ...config };

    switch (this.config.type) {
      case CacheType.MEMORY:
        this.cache = new MemoryCache(this.config);
        break;
      case CacheType.HTTP:
        this.cache = new HttpCache(this.config);
        break;
      default:
        this.cache = new MemoryCache(this.config);
    }
  }

  // Generate cache key
  generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');

    const key = sortedParams ? `${prefix}:${sortedParams}` : prefix;
    return this.config.namespace ? `${this.config.namespace}:${key}` : key;
  }

  // Get value from cache
  async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
  }

  // Set value in cache
  async set<T>(key: string, value: T, ttl?: number, tags: string[] = []): Promise<void> {
    await this.cache.set(key, value, ttl, tags);
  }

  // Get or set value (cache-aside pattern)
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
    tags: string[] = []
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttl, tags);
    return value;
  }

  // Delete value from cache
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  // Clear all cache
  async clear(): Promise<void> {
    await this.cache.clear();
  }

  // Invalidate cache entries
  async invalidate(options: InvalidationOptions = {}): Promise<number> {
    return this.cache.invalidate(options);
  }

  // Get cache statistics
  async getStats(): Promise<CacheStats> {
    return this.cache.getStats();
  }

  // Cache middleware for API routes
  static withCache(config: CacheConfig = defaultCacheConfig) {
    const cacheHandler = new CacheHandler(config);

    return function <T extends unknown[]>(
      handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
    ) {
      return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
        const url = new URL(request.url);
        const cacheKey = cacheHandler.generateKey(url.pathname, Object.fromEntries(url.searchParams));

        // Check cache for GET requests
        if (request.method === 'GET') {
          const cached = await cacheHandler.get<NextResponse>(cacheKey);
          if (cached) {
            // Add cache hit headers
            cached.headers.set('X-Cache', 'HIT');
            cached.headers.set('X-Cache-Key', cacheKey);
            return cached;
          }
        }

        // Execute handler
        const response = await handler(request, ...args);

        // Cache successful GET responses
        if (request.method === 'GET' && response.status === 200) {
          const responseClone = response.clone();
          await cacheHandler.set(cacheKey, responseClone, config.ttl, ['api', 'get']);

          // Add cache miss headers
          response.headers.set('X-Cache', 'MISS');
          response.headers.set('X-Cache-Key', cacheKey);
        }

        return response;
      };
    };
  }

  // Cache with custom key generation
  static withCustomCache(
    keyGenerator: (request: NextRequest) => string,
    config: CacheConfig = defaultCacheConfig
  ) {
    const cacheHandler = new CacheHandler(config);

    return function <T extends unknown[]>(
      handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
    ) {
      return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
        const cacheKey = keyGenerator(request);

        // Check cache for GET requests
        if (request.method === 'GET') {
          const cached = await cacheHandler.get<NextResponse>(cacheKey);
          if (cached) {
            cached.headers.set('X-Cache', 'HIT');
            cached.headers.set('X-Cache-Key', cacheKey);
            return cached;
          }
        }

        // Execute handler
        const response = await handler(request, ...args);

        // Cache successful GET responses
        if (request.method === 'GET' && response.status === 200) {
          const responseClone = response.clone();
          await cacheHandler.set(cacheKey, responseClone, config.ttl);

          response.headers.set('X-Cache', 'MISS');
          response.headers.set('X-Cache-Key', cacheKey);
        }

        return response;
      };
    };
  }
}

// Cache utilities
export const cacheUtils = {
  // Create cache key from request
  createKey: (request: NextRequest, prefix: string = 'api'): string => {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const cacheHandler = new CacheHandler();
    return cacheHandler.generateKey(`${prefix}:${url.pathname}`, params);
  },

  // Create cache key with custom parameters
  createKeyWithParams: (pathname: string, params: Record<string, any> = {}, prefix: string = 'api'): string => {
    const cacheHandler = new CacheHandler();
    return cacheHandler.generateKey(`${prefix}:${pathname}`, params);
  },

  // Cache response with ETag
  cacheWithETag: async (
    cacheHandler: CacheHandler,
    key: string,
    data: any,
    ttl?: number
  ): Promise<{ data: any; etag: string }> => {
    const etag = `"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 8)}"`;
    await cacheHandler.set(key, { data, etag }, ttl);
    return { data, etag };
  },

  // Check ETag and return 304 if not modified
  checkETag: (request: NextRequest, etag: string): boolean => {
    const ifNoneMatch = request.headers.get('if-none-match');
    return ifNoneMatch === etag;
  },

  // Cache invalidation helpers
  invalidateByTags: async (cacheHandler: CacheHandler, tags: string[]): Promise<number> => {
    return cacheHandler.invalidate({ tags });
  },

  invalidateByPattern: async (cacheHandler: CacheHandler, pattern: string | RegExp): Promise<number> => {
    return cacheHandler.invalidate({ pattern });
  },

  invalidateByDate: async (cacheHandler: CacheHandler, before: Date): Promise<number> => {
    return cacheHandler.invalidate({ before });
  }
};

// Cache configuration presets
export const cachePresets = {
  // Short-term cache (1 minute)
  short: {
    ...defaultCacheConfig,
    ttl: 60 * 1000,
    maxEntries: 100
  },

  // Medium-term cache (5 minutes)
  medium: {
    ...defaultCacheConfig,
    ttl: 5 * 60 * 1000,
    maxEntries: 500
  },

  // Long-term cache (1 hour)
  long: {
    ...defaultCacheConfig,
    ttl: 60 * 60 * 1000,
    maxEntries: 1000
  },

  // Static content cache (1 day)
  static: {
    ...defaultCacheConfig,
    ttl: 24 * 60 * 60 * 1000,
    maxEntries: 2000
  },

  // API response cache (30 seconds)
  api: {
    ...defaultCacheConfig,
    ttl: 30 * 1000,
    maxEntries: 200
  }
};
