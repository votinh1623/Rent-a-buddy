// backend/src/config/database.config.js
import dotenv from "dotenv";
dotenv.config();

const config = {
  mongo: {
    uri: process.env.MONGO_URI, // || 'mongodb://localhost:27017/toonkidz'
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  }
};

export default config;
