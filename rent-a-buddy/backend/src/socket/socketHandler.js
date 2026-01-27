// socket/socketHandler.js
import { Server } from "socket.io";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"], // Cả hai port của React
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    },
    transports: ['websocket', 'polling'] // Hỗ trợ cả hai loại transport
  });

  // Lưu trữ user socket mapping
  const userSocketMap = new Map(); // { userId: socketId }

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    // Lấy userId từ query params khi kết nối
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`✅ User ${userId} connected with socket ${socket.id}`);

      // Gửi danh sách online users cho tất cả clients
      const onlineUsers = Array.from(userSocketMap.keys());
      io.emit('getOnlineUsers', onlineUsers);
    }

    // Event khi user tham gia (có thể dùng để đồng bộ)
    socket.on('new-user-add', (userId) => {
      if (userId && !userSocketMap.has(userId)) {
        userSocketMap.set(userId, socket.id);
        const onlineUsers = Array.from(userSocketMap.keys());
        io.emit('getOnlineUsers', onlineUsers);
        console.log(`➕ User ${userId} added to online list`);
      }
    });

    // Gửi và nhận tin nhắn
    socket.on('sendMessage', async (messageData) => {
      const { receiverId, conversationId, content, senderId, messageType } = messageData;
      console.log('📨 Message received:', { receiverId, conversationId, content });

      try {
        // Lưu message vào database
        const newMessage = await Message.create({
          senderId: senderId,
          receiverId: receiverId,
          conversationId: conversationId,
          content: content,
          messageType: messageType || 'text'
        });

        // Populate thông tin người gửi
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('senderId', 'name pfp')
          .populate('receiverId', 'name pfp');

        // Gửi cho receiver nếu online
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', populatedMessage);
          console.log(`📤 Message delivered to ${receiverId}`);
        }

        // Gửi lại cho sender để confirm
        socket.emit('messageSent', populatedMessage);

        // Cập nhật conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: populatedMessage._id,
          lastActivity: new Date()
        });

      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('messageError', { error: 'Failed to save message' });
      }
    });


    // Chỉnh sửa tin nhắn
    socket.on('editMessage', ({ messageId, newContent }) => {
      console.log(`✏️ Message ${messageId} edited`);
      // Broadcast to all clients in the conversation
      io.emit('messageEdited', { _id: messageId, content: newContent, isEdited: true });
    });

    // Xóa tin nhắn
    socket.on('deleteMessage', ({ messageId }) => {
      console.log(`🗑️ Message ${messageId} deleted`);
      io.emit('messageDeleted', { messageId });
    });

    // Đánh dấu đã đọc
    socket.on('markAsRead', ({ conversationId }) => {
      console.log(`👁️ Conversation ${conversationId} marked as read`);
      io.emit('unreadCountReset', { conversationId });
    });

    // Video call events
    socket.on('call-user', (data) => {
      const { receiverId, roomId, callerId, callerName, pfp, conversationId } = data;
      console.log(`📞 Call from ${callerId} to ${receiverId}, room: ${roomId}`);

      const receiverSocketId = userSocketMap.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incoming-call', {
          from: callerId,
          name: callerName,
          pfp: pfp,
          roomId: roomId,
          conversationId: conversationId
        });
      }
    });

    socket.on('accept-call', ({ roomId, callerId }) => {
      console.log(`✅ Call accepted for room ${roomId}`);
      const callerSocketId = userSocketMap.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call-accepted', { roomId });
      }
    });

    socket.on('reject-call', ({ callerId }) => {
      console.log(`❌ Call rejected for caller ${callerId}`);
      const callerSocketId = userSocketMap.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call-rejected');
      }
    });

    // Ngắt kết nối
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);

      // Xóa user khỏi map khi disconnect
      let disconnectedUserId = null;
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          userSocketMap.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        console.log(`➖ User ${disconnectedUserId} removed from online list`);
        const onlineUsers = Array.from(userSocketMap.keys());
        io.emit('getOnlineUsers', onlineUsers);
      }
    });
  });

  return io;
};