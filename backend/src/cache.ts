import Redis from "ioredis";
import { logger } from "./config";

// Redis client configuration
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CACHE_ENABLED = process.env.CACHE_ENABLED !== "false";

// TTL (Time To Live) in seconds
const CACHE_TTL = {
  ENTRY: 60 * 60, // 1 hour - single entry
  MONTH: 60 * 30, // 30 minutes - monthly entries list
  USER_ENTRIES: 60 * 60 * 24, // 24 hours - user's all entries metadata (reserved for future use)
};

class CacheManager {
  private client: Redis | null = null;
  private isConnected = false;
  private isReady = false;

  constructor() {
    if (!CACHE_ENABLED) {
      logger.info("Cache is disabled");
      return;
    }

    try {
      this.client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        lazyConnect: true,
      });

      this.client.on("connect", () => {
        this.isConnected = true;
        logger.info("Redis connected");
      });

      this.client.on("ready", () => {
        this.isReady = true;
        logger.info("Redis ready");
      });

      this.client.on("error", (error) => {
        logger.error({ err: error }, "Redis connection error");
        this.isConnected = false;
        this.isReady = false;
      });

      this.client.on("close", () => {
        this.isConnected = false;
        this.isReady = false;
        logger.warn("Redis connection closed");
      });

      // Connect asynchronously
      this.client.connect().catch((error) => {
        logger.error({ err: error }, "Failed to connect to Redis");
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to initialize Redis client");
    }
  }

  /**
   * Check if cache is connected and ready
   */
  isHealthy(): boolean {
    return this.isReady && this.isConnected;
  }

  /**
   * Generate cache key for a single entry
   */
  private getEntryKey(userId: string, date: string): string {
    return `entry:${userId}:${date}`;
  }

  /**
   * Generate cache key for monthly entries
   */
  private getMonthKey(
    userId: string,
    year: number,
    month: number,
    page: number,
    limit: number,
  ): string {
    return `month:${userId}:${year}-${month}:p${page}:l${limit}`;
  }

  /**
   * Generate pattern for invalidating all entries for a user's month
   */
  private getMonthPattern(userId: string, year: number, month: number): string {
    return `month:${userId}:${year}-${month}:*`;
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isReady) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error({ err: error, key }, "Cache get error");
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  async set(key: string, value: unknown, ttl: number): Promise<void> {
    if (!this.client || !this.isReady) {
      return;
    }

    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error({ err: error, key }, "Cache set error");
    }
  }

  /**
   * Delete cached data by key
   */
  async del(key: string): Promise<void> {
    if (!this.client || !this.isReady) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error({ err: error, key }, "Cache delete error");
    }
  }

  /**
   * Delete multiple keys matching a pattern using SCAN for production safety
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isReady) {
      return;
    }

    try {
      let cursor = "0";
      let deletedCount = 0;

      do {
        // Use SCAN instead of KEYS to avoid blocking Redis
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          await this.client.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== "0");

      if (deletedCount > 0) {
        logger.debug({ pattern, count: deletedCount }, "Deleted cache keys");
      }
    } catch (error) {
      logger.error({ err: error, pattern }, "Cache pattern delete error");
    }
  }

  /**
   * Cache a single entry
   */
  async cacheEntry(userId: string, date: string, entry: unknown): Promise<void> {
    const key = this.getEntryKey(userId, date);
    await this.set(key, entry, CACHE_TTL.ENTRY);
  }

  /**
   * Get cached single entry
   */
  async getCachedEntry<T>(userId: string, date: string): Promise<T | null> {
    const key = this.getEntryKey(userId, date);
    return this.get<T>(key);
  }

  /**
   * Cache monthly entries
   */
  async cacheMonthEntries(
    userId: string,
    year: number,
    month: number,
    page: number,
    limit: number,
    data: unknown,
  ): Promise<void> {
    const key = this.getMonthKey(userId, year, month, page, limit);
    await this.set(key, data, CACHE_TTL.MONTH);
  }

  /**
   * Get cached monthly entries
   */
  async getCachedMonthEntries<T>(
    userId: string,
    year: number,
    month: number,
    page: number,
    limit: number,
  ): Promise<T | null> {
    const key = this.getMonthKey(userId, year, month, page, limit);
    return this.get<T>(key);
  }

  /**
   * Invalidate all caches for a specific entry and its month
   */
  async invalidateEntry(userId: string, date: Date): Promise<void> {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    // Delete single entry cache
    await this.del(this.getEntryKey(userId, dateStr));

    // Delete all monthly caches for this month (all pages/limits)
    await this.delPattern(this.getMonthPattern(userId, year, month));

    logger.debug({ userId, date: dateStr }, "Invalidated entry cache");
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info("Redis connection closed");
    }
  }
}

// Export singleton instance
export const cache = new CacheManager();
