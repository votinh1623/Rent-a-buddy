// backend/src/controllers/conversation.controller.js
import Conversation from '../models/conversation.model.js';
import User from '../models/user.model.js';

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      'participants.userId': userId
    })
      .populate({
        path: 'participants.userId',
        select: 'name pfp'
      })
      .populate('lastMessage.senderId', 'name pfp')
      .sort({ lastMessageAt: -1 });

    const formattedConversations = conversations
      .map(convo => {
        const otherParticipant = convo.participants.find(
          p => p.userId && p.userId._id.toString() !== userId.toString()
        );

        if (!otherParticipant) {
          return null;
        }

        return {
          _id: convo._id,
          partner: otherParticipant.userId,
          lastMessage: convo.lastMessage,
          unreadCount: convo.unreadCounts.get(userId.toString()) || 0
        }
      })
      .filter(Boolean);

    res.json({ success: true, conversations: formattedConversations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
export const getConversationById = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;

    // Tìm conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId  // Đảm bảo user là participant
    })
      .populate({
        path: 'participants.userId',
        select: 'name pfp role email'
      })
      .populate('lastMessage.senderId', 'name pfp')
      .populate('booking', 'status destination date'); // Nếu có booking

    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found or access denied' 
      });
    }

    // Format response
    const otherParticipant = conversation.participants.find(
      p => p.userId && p.userId._id.toString() !== userId.toString()
    );

    const formattedConversation = {
      _id: conversation._id,
      partner: otherParticipant?.userId || null,
      lastMessage: conversation.lastMessage,
      unreadCount: conversation.unreadCounts?.get(userId.toString()) || 0,
      participants: conversation.participants,
      type: conversation.type,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    };

    res.json({ 
      success: true, 
      conversation: formattedConversation 
    });

  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
export const findOrCreateConversation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ success: false, error: "Bạn không thể tự trò chuyện với chính mình." });
    }

    let conversation = await Conversation.findOne({
      type: 'direct',
      'participants.userId': { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'direct',
        participants: [{ userId: senderId }, { userId: receiverId }],
        lastMessageAt: Date.now()
      });
    }
    res.json({ success: true, conversationId: conversation._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
export const getRecentConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 3;
    
    // Lấy TẤT CẢ conversations của user
    const conversations = await Conversation.find({
      'participants.userId': userId
    })
      .populate({
        path: 'participants.userId',
        select: 'name pfp role email'
      })
      .populate('lastMessage.senderId', 'name pfp')
      .sort({ 
        lastMessageAt: -1,  // Ưu tiên conversations có tin nhắn
        updatedAt: -1       // Fallback: conversations mới nhất
      })
      .limit(limit);
    
    console.log(`Found ${conversations.length} conversations for user ${userId}`);
    
    // Format response
    const formattedConversations = conversations.map(convo => {
      // Tìm other participant
      const otherParticipant = convo.participants.find(
        p => p.userId && p.userId._id.toString() !== userId.toString()
      );
      
      // Tính unread count - fix Map access
      let unreadCount = 0;
      if (convo.unreadCounts && convo.unreadCounts instanceof Map) {
        unreadCount = convo.unreadCounts.get(userId.toString()) || 0;
      } else if (convo.unreadCounts && typeof convo.unreadCounts === 'object') {
        // Nếu unreadCounts là plain object
        unreadCount = convo.unreadCounts[userId.toString()] || 0;
      }
      
      // Lấy last message text
      let lastMessageText = 'New conversation';
      if (convo.lastMessage && convo.lastMessage.content) {
        lastMessageText = convo.lastMessage.content;
      }
      
      return {
        _id: convo._id,
        otherParticipant: otherParticipant?.userId || null,
        lastMessage: {
          text: lastMessageText,
          senderId: convo.lastMessage?.senderId,
          createdAt: convo.lastMessage?.createdAt
        },
        unreadCount: unreadCount,
        lastActivity: convo.lastMessageAt || convo.updatedAt || convo.createdAt,
        createdAt: convo.createdAt,
        updatedAt: convo.updatedAt
      };
    });
    
    console.log('Formatted conversations:', formattedConversations.length);
    
    res.json({
      success: true,
      data: formattedConversations
    });
    
  } catch (error) {
    console.error('Error getting recent conversations:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};