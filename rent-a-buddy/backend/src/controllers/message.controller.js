import Message from '../models/message.model.js';
import Conversation from '../models/conversation.model.js';
// import Post from '../models/post.model.js';

export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const currentUserId = req.user._id;
  const populatePost = req.query.populatePost === 'true';

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation || !conversation.participants.some(p => p.userId.equals(currentUserId))) {
      return res.status(403).json({ success: false, error: "Unauthorized access to conversation" });
    }

    let messageQuery = Message.find({ conversationId });
    messageQuery = messageQuery.populate('senderId', 'name pfp');

    // if (populatePost) {
    //   messageQuery = messageQuery.populate({
    //     path: 'sharedPostId',
    //     populate: [
    //       { path: 'userId', select: 'name pfp' },
    //       { path: 'storyId' },
    //       {
    //         path: 'originalPostId',
    //         populate: [
    //           { path: 'userId', select: 'name pfp' },
    //           { path: 'storyId' }
    //         ]
    //       }
    //     ]
    //   });
    // }

    const messages = await messageQuery.sort({ createdAt: 1 });

    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { [`unreadCounts.${currentUserId}`]: 0 } }
    );


    res.json({ success: true, messages });

  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendMessageHTTP = async (req, res) => {
  try {
    const { content, receiverId, conversationId, messageType } = req.body;
    const senderId = req.user._id;
    
    // VALIDATION: Kiểm tra receiverId nếu không có conversationId
    if (!conversationId && !receiverId) {
      return res.status(400).json({ 
        error: "Either conversationId or receiverId is required" 
      });
    }
    
    let conversation;
    
    if (conversationId) {
      // Tìm conversation bằng ID
      conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ 
          error: "Conversation not found" 
        });
      }
      
      // Kiểm tra user có trong conversation không
      const isParticipant = conversation.participants.some(
        p => p.userId.toString() === senderId.toString()
      );
      
      if (!isParticipant) {
        return res.status(403).json({ 
          error: "You are not a participant of this conversation" 
        });
      }
      
    } else {
      // Tìm conversation giữa 2 users
      conversation = await Conversation.findOne({
        type: 'direct',
        'participants.userId': { $all: [senderId, receiverId] }
      });
      
      if (!conversation) {
        // Tạo conversation mới
        conversation = await Conversation.create({
          type: 'direct',
          participants: [
            { userId: senderId },
            { userId: receiverId }
          ],
          // Khởi tạo Map đúng cách
          unreadCounts: new Map()
        });
        
        // Set initial values
        conversation.unreadCounts.set(senderId.toString(), 0);
        conversation.unreadCounts.set(receiverId.toString(), 0);
      }
    }
    
    // Tạo message mới
    const newMessage = new Message({
      conversationId: conversation._id,
      senderId: senderId,
      content: content,
      messageType: messageType || 'text',
      // sharedPostId: null // nếu không dùng
    });
    
    // Cập nhật lastMessage
    conversation.lastMessage = {
      _id: newMessage._id,
      content: newMessage.content,
      senderId: senderId,
      createdAt: newMessage.createdAt,
      messageType: messageType || 'text'
    };
    conversation.lastMessageAt = newMessage.createdAt;
    
    // Đảm bảo unreadCounts tồn tại và là Map
    if (!conversation.unreadCounts || !(conversation.unreadCounts instanceof Map)) {
      conversation.unreadCounts = new Map();
    }
    
    // Cập nhật unread counts
    // Tăng count cho receiver (tất cả participants trừ sender)
    conversation.participants.forEach(participant => {
      const participantId = participant.userId.toString();
      
      if (participantId !== senderId.toString()) {
        const currentUnread = conversation.unreadCounts.get(participantId) || 0;
        conversation.unreadCounts.set(participantId, currentUnread + 1);
      } else {
        // Reset count cho sender
        conversation.unreadCounts.set(participantId, 0);
      }
    });
    
    // Lưu cả hai
    await Promise.all([newMessage.save(), conversation.save()]);
    
    // Populate sender info
    await newMessage.populate('senderId', 'name pfp');
    
    res.status(201).json(newMessage);
    
  } catch (error) {
    console.log("Error in sendMessage controller", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};