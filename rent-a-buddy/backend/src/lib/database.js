import mongoose from "mongoose";
import redis from "redis";
import { promisify } from "util";
import config from "../config/database.config.js";

class DatabaseConnection {
  constructor() {
    this.mongoConnection = null;
    this.redisClient = null;
  }

  async connectMongo() {
    if (this.mongoConnection) return this.mongoConnection;

    try {
      this.mongoConnection = await mongoose.connect(
        config.mongo.uri,
        config.mongo.options
      );
      console.log("MongoDB connected successfully");
      return this.mongoConnection;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }

  async connectRedis() {
    if (this.redisClient) return this.redisClient;

    try {
      this.redisClient = redis.createClient({ url: config.redis.url });

      this.redisClient.get = promisify(this.redisClient.get).bind(this.redisClient);
      this.redisClient.set = promisify(this.redisClient.set).bind(this.redisClient);
      this.redisClient.del = promisify(this.redisClient.del).bind(this.redisClient);

      await this.redisClient.connect();
      console.log("Redis connected successfully");
      return this.redisClient;
    } catch (error) {
      console.error("Redis connection error:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.mongoConnection) {
      await mongoose.disconnect();
      this.mongoConnection = null;
    }

    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }
}

export default new DatabaseConnection();
