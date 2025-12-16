//app.js
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import config from "./config/server.config.js";
import database from "./lib/database.js";
import authRoutes from "./routes/auth.route.js";
import activityRoutes from './routes/activity.route.js';
import destinationRoutes from './routes/destination.route.js';  
import buddyRoutes from './routes/buddy.route.js';
import { createServer } from "http";
import { Server } from "socket.io";
const app = express();

console.log('Environment variables loaded:');
console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET ? '***SET***' : '***NOT SET***');
console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET ? '***SET***' : '***NOT SET***');
console.log('Mongo: ', process.env.MONGO_URI);
database.connectMongo();
console.log("Redis URL:", process.env.REDIS_URL);
database.connectRedis();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
// Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// Routes
app.use('/api/activities', activityRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/buddies', buddyRoutes);
app.use('/api/auth', authRoutes);
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