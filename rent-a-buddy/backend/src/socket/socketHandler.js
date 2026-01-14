// backend/src/socket/socketHandler.js
import { Server } from 'socket.io';
// import { Conversation, Message } from '../models/conversation.model.js';

// Store online users
const onlineUsers = new Map(); // userId -> socketId

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Socket.io middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      // Verify token (similar to auth middleware)
      // const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      // const user = await User.findById(decoded.userId);
      
      // For demo, we'll just use the userId from handshake
      const userId = socket.handshake.auth.userId;
      if (!userId) {
        return next(new Error('Authentication error'));
      }
      
      socket.userId = userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Add user to online users
    onlineUsers.set(socket.userId, socket.id);
    
    // Join user to their personal room
    socket.join(`user_${socket.userId}`);
    
    // Join conversation rooms user is part of
    socket.on('joinConversations', async (conversationIds) => {
      conversationIds.forEach(conversationId => {
        socket.join(`conversation_${conversationId}`);
      });
    });
    
    // Handle sending message
    socket.on('sendMessage', async (data) => {
      try {
        const { conversationId, content, messageType = 'text' } = data;
        
        // Save message to database
        const message = new Message({
          conversation: conversationId,
          sender: socket.userId,
          content,
          messageType
        });
        
        await message.save();
        
        // Update conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.lastMessage = {
            text: content,
            sender: socket.userId,
            timestamp: new Date()
          };
          
          await conversation.incrementUnreadCount(socket.userId);
          await conversation.save();
          
          // Populate sender info
          await message.populate('sender', 'name pfp');
          
          // Broadcast to conversation room
          io.to(`conversation_${conversationId}`).emit('newMessage', {
            message: {
              _id: message._id,
              sender: {
                _id: message.sender._id,
                name: message.sender.name,
                pfp: message.sender.pfp
              },
              content: message.content,
              messageType: message.messageType,
              createdAt: message.createdAt
            },
            conversation: {
              _id: conversation._id,
              lastMessage: conversation.lastMessage,
              lastActivity: conversation.lastActivity
            }
          });
          
          // Notify other participants individually
          conversation.participants.forEach(participant => {
            if (!participant.equals(socket.userId)) {
              io.to(`user_${participant}`).emit('messageNotification', {
                conversationId,
                senderId: socket.userId,
                message: content.substring(0, 100),
                unreadCount: 1
              });
            }
          });
        }
      } catch (error) {
        console.error('Error in sendMessage:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation_${conversationId}`).emit('userTyping', {
        userId: socket.userId,
        conversationId,
        isTyping
      });
    });
    
    // Handle message read
    socket.on('markAsRead', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          await conversation.markAsRead(socket.userId);
          
          // Notify others that user has read messages
          socket.to(`conversation_${conversationId}`).emit('messagesRead', {
            userId: socket.userId,
            conversationId
          });
        }
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      onlineUsers.delete(socket.userId);
      
      // Notify conversations user was in
      io.emit('userOffline', { userId: socket.userId });
    });
  });

  return io;
};

// Helper to send notification via socket
export const sendNotification = (io, userId, notification) => {
  const socketId = onlineUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit('notification', notification);
  }
};