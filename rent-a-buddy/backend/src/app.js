//app.js
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import config from "./config/server.config.js";
const app = express();

// console.log('Environment variables loaded:');
// console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET ? '***SET***' : '***NOT SET***');
// console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET ? '***SET***' : '***NOT SET***');
// console.log('Mongo: ', process.env.MONGO_URI);
// database.connectMongo();
// console.log("Redis URL:", process.env.REDIS_URL);
// database.connectRedis();

// Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// Routes
// app.use('/api/auth', authRoutes);
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// const server = createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"]
//   }
// });

// initializeSocketIO(io);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server (Express + Socket.IO) đang chạy trên port ${PORT}`);
});