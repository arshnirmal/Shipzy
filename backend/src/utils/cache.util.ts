// services/backend/src/utils/cache.util.ts
import logger from "../config/logger.js";
import config from "../config/env.js";

// Simple in-memory cache as fallback when Redis is not available
class MemoryCache {
  private cache = new Map<string, { value: any; expiry: number }>();
  
  set(key: string, value: any, ttlSeconds: number = 3600): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  del(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Fallback memory cache
const memoryCache = new MemoryCache();

// Redis cache interface (will use memory cache if Redis is not configured)
interface CacheInterface {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// Memory cache implementation
class MemoryCacheAdapter implements CacheInterface {
  async get(key: string): Promise<any | null> {
    return memoryCache.get(key);
  }
  
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    memoryCache.set(key, value, ttlSeconds);
  }
  
  async del(key: string): Promise<void> {
    memoryCache.del(key);
  }
  
  async clear(): Promise<void> {
    memoryCache.clear();
  }
  
  async exists(key: string): Promise<boolean> {
    return memoryCache.get(key) !== null;
  }
}

// Initialize cache (memory cache for now, can be extended to Redis later)
const cache: CacheInterface = new MemoryCacheAdapter();

/**
 * Cache utility with TTL support
 */
export const cacheUtil = {
  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await cache.get(key);
      if (config.logging.logQueries) {
        logger.debug({
          msg: value !== null ? "Cache hit" : "Cache miss",
          key,
        });
      }
      return value;
    } catch (error) {
      logger.error({
        msg: "Cache get error",
        key,
        error: (error as Error).message,
      });
      return null;
    }
  },

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await cache.set(key, value, ttlSeconds);
      if (config.logging.logQueries) {
        logger.debug({
          msg: "Cache set",
          key,
          ttl: ttlSeconds,
        });
      }
    } catch (error) {
      logger.error({
        msg: "Cache set error",
        key,
        error: (error as Error).message,
      });
    }
  },

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await cache.del(key);
      if (config.logging.logQueries) {
        logger.debug({
          msg: "Cache delete",
          key,
        });
      }
    } catch (error) {
      logger.error({
        msg: "Cache delete error",
        key,
        error: (error as Error).message,
      });
    }
  },

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await cache.clear();
      logger.info({
        msg: "Cache cleared",
      });
    } catch (error) {
      logger.error({
        msg: "Cache clear error",
        error: (error as Error).message,
      });
    }
  },

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      return await cache.exists(key);
    } catch (error) {
      logger.error({
        msg: "Cache exists error",
        key,
        error: (error as Error).message,
      });
      return false;
    }
  },

  /**
   * Get cache stats
   */
  getStats() {
    return {
      type: "memory",
      size: memoryCache.size(),
      backend: "memory",
    };
  },
};

export default cacheUtil;
