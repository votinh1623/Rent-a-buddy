// backend/src/socket/socket.js
import User from '../models/user.model.js';
import mongoose from 'mongoose';

const userSocketMap = {};

export let io;
global.userSocketMap = userSocketMap;

const getOnlineUserIds = () => Object.keys(userSocketMap);

export const initializeSocketIO = (socketServer) => {

  global.io = socketServer;

  global.io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId && userId !== "undefined") {
      console.log(`Một người dùng đã kết nối: ${socket.id}, userId: ${userId}`);
      userSocketMap[userId] = socket.id;
    }

    global.io.emit('getOnlineUsers', getOnlineUserIds());

    socket.on('sendMessage', async (data) => {
      try {
        const message = await internalSendMessage(
          data.content,
          data.receiverId,
          userId,
          data.messageType,
          data.sharedPostId
        );

        const receiverSocketId = userSocketMap[data.receiverId];
        if (receiverSocketId) {
          global.io.to(receiverSocketId).emit('receiveMessage', message);
        }
        const responseData = message.toObject();
        responseData.tempId = data.tempId;

        socket.emit('messageSent', responseData);

      } catch (error) {
        console.error("Error handling message:", error.message);
        socket.emit('messageError', { error: "Failed to send message", tempId: data.tempId }); // Trả tempId để frontend xử lý lỗi
      }
    });

    socket.on('editMessage', async ({ messageId, newContent }) => {
      try {
        const updatedMsg = await Message.findOneAndUpdate(
          { _id: messageId, senderId: userId, messageType: 'text' },
          { content: newContent, isEdited: true },
          { new: true }
        ).populate('senderId', 'name pfp');

        if (!updatedMsg) return;

        const conversation = await Conversation.findById(updatedMsg.conversationId);
        const recipientId = conversation.participants.find(p => !p.userId.equals(userId)).userId;
        const recipientSocketId = userSocketMap[recipientId.toString()];

        global.io.to(userSocketMap[userId.toString()]).emit('messageEdited', updatedMsg);
        if (recipientSocketId) {
          global.io.to(recipientSocketId).emit('messageEdited', updatedMsg);
        }
      } catch (error) {
        console.error("Error editing message:", error.message);
      }
    });

    socket.on('deleteMessage', async ({ messageId }) => {
      try {
        const deletedMsg = await Message.findOneAndDelete({ _id: messageId, senderId: userId });

        if (!deletedMsg) return;

        const conversation = await Conversation.findById(deletedMsg.conversationId);
        const recipientId = conversation.participants.find(p => !p.userId.equals(userId)).userId;
        const recipientSocketId = userSocketMap[recipientId.toString()];

        global.io.to(userSocketMap[userId.toString()]).emit('messageDeleted', { messageId, conversationId: deletedMsg.conversationId });
        if (recipientSocketId) {
          global.io.to(recipientSocketId).emit('messageDeleted', { messageId, conversationId: deletedMsg.conversationId });
        }
      } catch (error) {
        console.error("Error deleting message:", error.message);
      }
    });

    socket.on('sendGuestMessage', async (data) => {
      try {
        console.log(`[Guest Message] - From: ${data.name} (${data.email}), Content: ${data.content}`);
        const ADMIN_ID = process.env.PRIMARY_ADMIN_ID;
        const adminSocketId = userSocketMap[ADMIN_ID];
        if (adminSocketId) {
          global.io.to(adminSocketId).emit('newGuestNotification', {
            name: data.name,
            content: data.content,
            email: data.email,
          });
        }

        socket.emit('guestMessageSent', { success: true, message: "Tin nhắn đã được gửi đến quản trị viên." });

      } catch (error) {
        console.error("Error handling guest message:", error.message);
        socket.emit('guestMessageSent', { success: false, error: "Lỗi gửi tin nhắn." });
      }
    });

    socket.on('markAsRead', async (data) => {
      try {
        console.log('markAsRead data:', data); // Debug log
        const { conversationId } = data;

        // Kiểm tra userId từ socket handshake query
        const socketUserId = socket.handshake.query.userId;

        if (!socketUserId || socketUserId === "undefined") {
          console.error('markAsRead: No valid userId found in socket');
          return;
        }

        if (!conversationId) {
          console.error('markAsRead: No conversationId provided');
          return;
        }

        console.log(`markAsRead - userId: ${socketUserId}, conversationId: ${conversationId}`);

        // Cập nhật unreadCounts trong database
        const result = await Conversation.updateOne(
          { _id: conversationId },
          {
            $set: {
              [`unreadCounts.${socketUserId}`]: 0
            },
            $addToSet: {
              seenBy: new mongoose.Types.ObjectId(socketUserId)
            }
          }
        );

        console.log('markAsRead update result:', result);

        // Emit event để cập nhật frontend
        socket.emit('unreadCountReset', {
          conversationId,
          userId: socketUserId
        });

        // Emit cho tất cả users trong conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.participants.forEach(participant => {
            const participantId = participant.userId.toString();
            const participantSocketId = userSocketMap[participantId];
            if (participantSocketId) {
              global.io.to(participantSocketId).emit('conversationRead', {
                conversationId,
                userId: socketUserId
              });
            }
          });
        }

      } catch (err) {
        console.error("Error marking as read:", err.message, err.stack);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Người dùng đã ngắt kết nối: ${socket.id}`);
      if (userId && userId !== "undefined") {
        delete userSocketMap[userId];
      }
      global.io.emit('getOnlineUsers', getOnlineUserIds());
    });
  });
};

const internalSendMessage = async (content, receiverId, senderId, messageType = 'text', sharedPostId = null) => {
  let conversation = await Conversation.findOne({
    type: 'direct',
    'participants.userId': { $all: [senderId, receiverId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      type: 'direct',
      participants: [
        { userId: senderId },
        { userId: receiverId }
      ],
      unreadCounts: new Map([
        [senderId.toString(), 0],
        [receiverId.toString(), 0]
      ])
    });
  }

  const newMessage = new Message({
    conversationId: conversation._id,
    senderId: senderId,
    receiverId: receiverId, // Thêm receiverId vào message
    content: content,
    messageType: messageType,
    sharedPostId: sharedPostId
  });

  // Cập nhật lastMessage
  conversation.lastMessage = {
    _id: newMessage._id,
    content: newMessage.content,
    senderId: senderId,
    createdAt: newMessage.createdAt,
    messageType: messageType
  };
  conversation.lastMessageAt = newMessage.createdAt;
  conversation.updatedAt = newMessage.createdAt;

  // Tăng unread count cho receiver
  const receiverIdStr = receiverId.toString();
  const currentUnread = conversation.unreadCounts.get(receiverIdStr) || 0;
  conversation.unreadCounts.set(receiverIdStr, currentUnread + 1);

  // Reset unread count cho sender
  conversation.unreadCounts.set(senderId.toString(), 0);

  // Cập nhật seenBy
  conversation.seenBy = [new mongoose.Types.ObjectId(senderId)];

  await Promise.all([newMessage.save(), conversation.save()]);

  // Populate sender info
  await newMessage.populate('senderId', 'name pfp');
  await newMessage.populate('receiverId', 'name pfp');

  if (sharedPostId) {
    const sharedPostData = await Post.findById(sharedPostId)
      .populate('userId', 'name pfp')
      .populate('storyId')
      .populate({
        path: 'originalPostId',
        populate: [
          { path: 'userId', select: 'name pfp' },
          { path: 'storyId' }
        ]
      });

    newMessage.sharedPostId = sharedPostData;
  }

  // Emit conversation update event
  const receiverSocketId = userSocketMap[receiverIdStr];
  const senderSocketId = userSocketMap[senderId.toString()];

  if (receiverSocketId) {
    global.io.to(receiverSocketId).emit('updateConversationLastMessage', {
      conversationId: conversation._id,
      lastMessage: conversation.lastMessage,
      unreadCount: currentUnread + 1
    });
  }

  if (senderSocketId) {
    global.io.to(senderSocketId).emit('updateConversationLastMessage', {
      conversationId: conversation._id,
      lastMessage: conversation.lastMessage,
      unreadCount: 0
    });
  }

  return newMessage;
};