import { createClient } from "redis";
import crypto from "crypto";

export class RedisCacheService {
  constructor() {
    // Initialize Redis client
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    // Handle Redis connection
    this.client.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    this.client.on("connect", () => {
      console.log("Connected to Redis");
    });

    this.client.on("ready", () => {
      console.log("Redis Client is ready");
    });

    // Connect to Redis
    this.connect();
  }

  // Connect to Redis
  async connect() {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
    } catch (error) {
      console.error("Error connecting to Redis:", error.message);
    }
  }

  // Ensure Redis is connected before operations
  async ensureConnected() {
    if (!this.client.isOpen) {
      await this.connect();
    }
  }

  // Get value from cache
  async get(key) {
    try {
      await this.ensureConnected();
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error(`Error getting cache for key ${key}:`, error.message);
      return null;
    }
  }

  // Set value in cache with expiration
  async set(key, value, expirySeconds = 300) {
    try {
      await this.ensureConnected();
      await this.client.setEx(key, expirySeconds, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting cache for key ${key}:`, error.message);
    }
  }

  // Delete value from cache
  async delete(key) {
    try {
      await this.ensureConnected();
      await this.client.del(key);
    } catch (error) {
      console.error(`Error deleting cache for key ${key}:`, error.message);
    }
  }

  // Delete all keys matching a pattern
  async deletePattern(pattern) {
    try {
      await this.ensureConnected();
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error(`Error deleting cache pattern ${pattern}:`, error.message);
    }
  }

  // Create a cache key for search queries
  createSearchCacheKey(params) {
    // Create a normalized string from search parameters
    const normalized = {
      query: params.query?.toLowerCase().trim() || "",
      category: params.category?.toLowerCase().trim() || "",
      instructor: params.instructor?.toLowerCase().trim() || "",
      skill_level: params.skill_level?.toLowerCase().trim() || "",
      limit: params.limit || 10,
      offset: params.offset || 0,
    };

    // Create a hash of the parameters for shorter keys
    const paramsString = JSON.stringify(normalized);
    const hash = crypto.createHash("md5").update(paramsString).digest("hex");

    return `search:${hash}`;
  }

  // Clear all search caches
  async clearSearchCache() {
    await this.deletePattern("search:*");
  }

  // Clear all course caches
  async clearCourseCache() {
    await this.deletePattern("course:*");
  }

  // Clear all caches
  async clearAllCache() {
    try {
      await this.ensureConnected();
      await this.client.flushDb();
    } catch (error) {
      console.error("Error clearing all cache:", error.message);
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      await this.ensureConnected();
      const info = await this.client.info("stats");
      const dbSize = await this.client.dbSize();

      return {
        dbSize,
        info,
      };
    } catch (error) {
      console.error("Error getting cache stats:", error.message);
      return null;
    }
  }

  // Close Redis connection
  async disconnect() {
    try {
      if (this.client.isOpen) {
        await this.client.quit();
      }
    } catch (error) {
      console.error("Error disconnecting from Redis:", error.message);
    }
  }
}
