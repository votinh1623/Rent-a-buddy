//redis.js
import config from '../config/database.config.js';
import { createClient } from 'redis';

const { redis } = config;

class RedisConnection {
  constructor() {
    this.client = null;
  }

  async connect() {
    if (this.client && this.client.isOpen) return this.client;
    try {
      this.client = createClient({ url: redis.url });
      this.client.on('error', (err) => console.error('Redis error:', err));
      this.client.on('connect', () => console.log('Redis connected'));

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Redis connection error:', error);
      this.client = null;
      return null;
    }
  }

  async disconnect() {
    if (this.client && this.client.isOpen) {
      await this.client.quit();
      this.client = null;
    }
  }

  async set(key, value, mode, duration) {
  await this.connect();
  try {
    // Support both old-style (mode, duration) and object-style
    if (mode && duration) {
      // Translate "EX", "PX", etc. to proper option key
      const opts = {};
      opts[mode] = duration;
      return await this.client.set(key, value, opts);
    } else {
      return await this.client.set(key, value);
    }
  } catch (error) {
    console.error("Redis set error:", error);
    return null;
  }
}


  async get(key) {
    await this.connect();
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key) {
    await this.connect();
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
      return null;
    }
  }
}

const redisInstance = new RedisConnection();
export default redisInstance;