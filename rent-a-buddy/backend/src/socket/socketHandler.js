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
    socket.on('sendMessage', async (data) => {
      try {
        // 1. Tạo message mới
        const message = new Message({
          conversationId: data.conversationId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          messageType: data.messageType || 'text'
        });

        const savedMessage = await message.save();

        // 2. Populate message
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate('senderId', 'name pfp')
          .populate('receiverId', 'name pfp')
          .lean();

        // 3. Cập nhật conversation
        const updatedConversation = await Conversation.findByIdAndUpdate(
          data.conversationId,
          {
            $set: {
              lastMessage: {
                _id: savedMessage._id,
                content: data.content,
                senderId: data.senderId,
                createdAt: savedMessage.createdAt,
                messageType: data.messageType || 'text'
              },
              lastMessageAt: savedMessage.createdAt,
              updatedAt: savedMessage.createdAt
            },
            $inc: {
              [`unreadCounts.${data.receiverId}`]: 1
            }
          },
          { new: true }
        );

        // 4. Emit events
        // 4a. Emit message tới conversation room
        io.to(data.conversationId).emit('receiveMessage', populatedMessage);

        // 4b. Emit update conversation last message tới cả hai users
        io.to(data.conversationId).emit('updateConversationLastMessage', {
          conversationId: data.conversationId,
          lastMessage: {
            _id: savedMessage._id,
            content: data.content,
            senderId: data.senderId,
            createdAt: savedMessage.createdAt,
            messageType: data.messageType || 'text'
          }
        });

        // 4c. Emit new message event cho user nhận (để hiển thị notification)
        io.to(data.receiverId).emit('newMessageInConversation', {
          conversationId: data.conversationId,
          message: populatedMessage
        });

      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('messageError', { error: 'Failed to send message' });
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
    // Trong backend socket handler
    socket.on('markAsRead', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          // Reset unread count cho user hiện tại
          const userId = socket.userId; // Giả sử bạn đã lưu userId trong socket
          conversation.unreadCounts.set(userId, 0);
          await conversation.save();

          // Emit event để cập nhật frontend
          io.to(conversationId).emit('conversationRead', { conversationId });
        }
      } catch (error) {
        console.error('Error marking as read:', error);
      }
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