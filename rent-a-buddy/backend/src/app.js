// app.js
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
import travellerRoutes from './routes/traveller.route.js';
import bookingRoutes from './routes/booking.route.js'
import messageRoutes from './routes/message.route.js'
import userRoutes from './routes/user.route.js';
import conversationRoutes from './routes/conversation.route.js';
import { createServer } from "http";
import { initializeSocket } from './socket/socketHandler.js';

const app = express();

// Khởi tạo database
console.log('Environment variables loaded:');
console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET ? '***SET***' : '***NOT SET***');
console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET ? '***SET***' : '***NOT SET***');
console.log('Mongo: ', process.env.MONGO_URI);
database.connectMongo();
console.log("Redis URL:", process.env.REDIS_URL);
database.connectRedis();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Thêm cả port 3000 cho React
  credentials: true
}));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/travellers', travellerRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/buddies', buddyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Tạo HTTP server từ Express app
const server = createServer(app);

// Khởi tạo Socket.IO
const io = initializeSocket(server);

// Make io accessible to routes if needed
app.set('io', io);

const PORT = config.port || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server đang chạy trên port ${PORT}`);
  console.log(`🔌 Socket.IO đã sẵn sàng`);
});