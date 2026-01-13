// backend/src/controllers/conversation.controller.js
import { Conversation, Message } from '../models/conversation.model.js';
import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';

// Helper function to format conversation response
const formatConversationResponse = (conversation, currentUserId) => {
  const otherParticipant = conversation.participants.find(
    p => p._id.toString() !== currentUserId.toString()
  );
  
  const userUnread = conversation.unreadCounts?.find(
    u => u.userId?.toString() === currentUserId.toString()
  );
  
  return {
    _id: conversation._id,
    participants: conversation.participants,
    otherParticipant: otherParticipant ? {
      _id: otherParticipant._id,
      name: otherParticipant.name,
      pfp: otherParticipant.pfp,
      role: otherParticipant.role
    } : null,
    booking: conversation.booking,
    lastMessage: conversation.lastMessage,
    unreadCount: userUnread?.count || 0,
    title: conversation.title,
    lastActivity: conversation.lastActivity,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
};

// Get all conversations for a user
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, page = 1 } = req.query;
    
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;
    
    // Find conversations where user is a participant
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
    .populate({
      path: 'participants',
      select: 'name pfp role email'
    })
    .populate({
      path: 'booking',
      select: 'status destination startDate',
      populate: {
        path: 'destination',
        select: 'name coverImg'
      }
    })
    .sort({ lastActivity: -1 })
    .skip(skip)
    .limit(limitNum);
    
    // Format response
    const formattedConversations = conversations.map(conv => 
      formatConversationResponse(conv, userId)
    );
    
    // Get total count for pagination
    const total = await Conversation.countDocuments({
      participants: userId,
      isActive: true
    });
    
    const totalPages = Math.ceil(total / limitNum);
    
    res.status(200).json({
      success: true,
      count: conversations.length,
      total,
      totalPages,
      currentPage: pageNum,
      data: formattedConversations
    });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get or create conversation between two users
export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const { bookingId } = req.query;
    const currentUserId = req.user._id;
    
    // Check if other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if trying to message yourself
    if (otherUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself'
      });
    }
    
    // If bookingId is provided, verify the booking involves both users
    if (bookingId) {
      const booking = await Booking.findOne({
        _id: bookingId,
        $or: [
          { traveller: currentUserId, buddy: otherUserId },
          { traveller: otherUserId, buddy: currentUserId }
        ]
      });
      
      if (!booking) {
        return res.status(403).json({
          success: false,
          message: 'Booking not found or not authorized'
        });
      }
    }
    
    // Find or create conversation
    const conversation = await Conversation.findOrCreateConversation(
      currentUserId,
      otherUserId,
      bookingId
    );
    
    // Populate participants
    await conversation.populate({
      path: 'participants',
      select: 'name pfp role email'
    });
    
    const formattedConversation = formatConversationResponse(conversation, currentUserId);
    
    res.status(200).json({
      success: true,
      data: formattedConversation
    });
    
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get messages in a conversation
export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { limit = 50, before = null } = req.query;
    
    const limitNum = parseInt(limit);
    
    // Check if user is a participant in the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    const isParticipant = conversation.participants.some(p => 
      p.equals(userId)
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this conversation'
      });
    }
    
    // Build query for messages
    let query = { 
      conversation: conversationId,
      isDeleted: false 
    };
    
    // If before is provided, get messages before this date
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    // Get messages
    const messages = await Message.find(query)
      .populate('sender', 'name pfp role')
      .populate('replyTo', 'content sender')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'name pfp'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limitNum);
    
    // Mark conversation as read for this user
    await conversation.markAsRead(userId);
    
    // Format response (reverse to show oldest first)
    const formattedMessages = messages.reverse().map(msg => ({
      _id: msg._id,
      sender: {
        _id: msg.sender._id,
        name: msg.sender.name,
        pfp: msg.sender.pfp,
        role: msg.sender.role
      },
      content: msg.content,
      messageType: msg.messageType,
      mediaUrl: msg.mediaUrl,
      mediaType: msg.mediaType,
      location: msg.location,
      bookingReference: msg.bookingReference,
      readBy: msg.readBy,
      reactions: msg.reactions,
      replyTo: msg.replyTo ? {
        _id: msg.replyTo._id,
        content: msg.replyTo.content,
        sender: msg.replyTo.sender?.name
      } : null,
      editedAt: msg.editedAt,
      isDeleted: msg.isDeleted,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: formattedMessages,
      conversation: formatConversationResponse(conversation, userId)
    });
    
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { 
      content, 
      messageType = 'text', 
      mediaUrl, 
      mediaType,
      location,
      bookingReference,
      replyTo 
    } = req.body;
    
    const senderId = req.user._id;
    
    // Validate required fields
    if (!content && !mediaUrl && !location && !bookingReference) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    // Check conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name pfp');
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    const isParticipant = conversation.participants.some(p => 
      p._id.equals(senderId)
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this conversation'
      });
    }
    
    // Validate replyTo if provided
    if (replyTo) {
      const repliedMessage = await Message.findById(replyTo);
      if (!repliedMessage || !repliedMessage.conversation.equals(conversationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid message to reply to'
        });
      }
    }
    
    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      content: content || '',
      messageType,
      mediaUrl,
      mediaType,
      location,
      bookingReference,
      replyTo,
      readBy: [{
        userId: senderId,
        readAt: new Date()
      }]
    });
    
    await message.save();
    
    // Update conversation last message and increment unread counts
    conversation.lastMessage = {
      text: content || (mediaUrl ? '📎 Media' : '📍 Location') || '📋 Booking update',
      sender: senderId,
      timestamp: new Date()
    };
    
    await conversation.incrementUnreadCount(senderId);
    
    // Populate sender info
    await message.populate('sender', 'name pfp role');
    if (replyTo) {
      await message.populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'name pfp'
        }
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        _id: message._id,
        sender: {
          _id: message.sender._id,
          name: message.sender.name,
          pfp: message.sender.pfp,
          role: message.sender.role
        },
        content: message.content,
        messageType: message.messageType,
        mediaUrl: message.mediaUrl,
        location: message.location,
        bookingReference: message.bookingReference,
        replyTo: message.replyTo ? {
          _id: message.replyTo._id,
          content: message.replyTo.content,
          sender: message.replyTo.sender?.name
        } : null,
        createdAt: message.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    
    // Check conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    const isParticipant = conversation.participants.some(p => 
      p.equals(userId)
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        }
      }
    );
    
    // Update conversation unread count
    await conversation.markAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Edit a message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'New content is required'
      });
    }
    
    // Find message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user is the sender
    if (!message.sender.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this message'
      });
    }
    
    // Check if message can be edited (e.g., within 15 minutes)
    const timeSinceCreated = new Date() - message.createdAt;
    const fifteenMinutes = 15 * 60 * 1000;
    
    if (timeSinceCreated > fifteenMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Message can only be edited within 15 minutes of sending'
      });
    }
    
    // Update message
    message.content = content;
    message.editedAt = new Date();
    await message.save();
    
    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: {
        _id: message._id,
        content: message.content,
        editedAt: message.editedAt
      }
    });
    
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete a message (soft delete)
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    
    // Find message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user is the sender
    if (!message.sender.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }
    
    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// React to a message
export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;
    
    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }
    
    // Find message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user is in the conversation
    const conversation = await Conversation.findById(message.conversation);
    const isParticipant = conversation.participants.some(p => 
      p.equals(userId)
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      r => r.userId.equals(userId) && r.emoji === emoji
    );
    
    if (existingReactionIndex > -1) {
      // Remove reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add or update reaction
      const userReactionIndex = message.reactions.findIndex(
        r => r.userId.equals(userId)
      );
      
      if (userReactionIndex > -1) {
        // Update existing reaction
        message.reactions[userReactionIndex].emoji = emoji;
        message.reactions[userReactionIndex].addedAt = new Date();
      } else {
        // Add new reaction
        message.reactions.push({
          userId,
          emoji,
          addedAt: new Date()
        });
      }
    }
    
    await message.save();
    
    res.status(200).json({
      success: true,
      message: 'Reaction updated',
      data: {
        reactions: message.reactions
      }
    });
    
  } catch (error) {
    console.error('Error reacting to message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get conversation with a specific user (alternative to getOrCreate)
export const getDirectConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const currentUserId = req.user._id;
    
    // Find existing conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId], $size: 2 }
    })
    .populate({
      path: 'participants',
      select: 'name pfp role email'
    })
    .populate({
      path: 'booking',
      select: 'status destination',
      populate: {
        path: 'destination',
        select: 'name'
      }
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'No conversation found',
        data: null
      });
    }
    
    const formattedConversation = formatConversationResponse(conversation, currentUserId);
    
    res.status(200).json({
      success: true,
      data: formattedConversation
    });
    
  } catch (error) {
    console.error('Error getting direct conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Archive conversation
export const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    // Check if user is participant
    const isParticipant = conversation.participants.some(p => 
      p.equals(userId)
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Add to archivedBy or remove from isActive
    conversation.archivedBy.push({
      userId,
      archivedAt: new Date()
    });
    
    await conversation.save();
    
    res.status(200).json({
      success: true,
      message: 'Conversation archived'
    });
    
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};