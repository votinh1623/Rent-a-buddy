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