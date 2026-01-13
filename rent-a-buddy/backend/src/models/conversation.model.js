// backend/src/models/conversation.model.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Reference to booking (optional - for conversations related to a specific booking)
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  // For easy identification
  lastMessage: {
    text: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date
  },
  
  // Track unread messages for each participant
  unreadCounts: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  
  // Conversation metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  // For notifications
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  // Optional: Conversation title/description
  title: String,
  
  // For archiving
  archivedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    archivedAt: Date
  }]
}, {
  timestamps: true
});

// Message sub-schema (embedded in conversation)
const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'location', 'booking_update', 'system'],
    default: 'text'
  },
  
  // For media messages
  mediaUrl: String,
  mediaType: String,
  fileName: String,
  fileSize: Number,
  
  // For location messages
  location: {
    latitude: Number,
    longitude: Number,
    name: String,
    address: String
  },
  
  // For booking-related messages
  bookingReference: {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    action: String, // e.g., "booking_created", "status_updated", "payment_received"
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Message status
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: Date
  }],
  
  // For message reactions/emojis
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    addedAt: Date
  }],
  
  // For edited/deleted messages
  editedAt: Date,
  deletedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // Reference to replied message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Indexes for performance
conversationSchema.index({ participants: 1, lastActivity: -1 });
conversationSchema.index({ booking: 1 });
conversationSchema.index({ 'participants.userId': 1, isActive: 1 });

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ 'readBy.userId': 1 });
messageSchema.index({ createdAt: 1 });

// Virtual for participants info (excluding current user)
conversationSchema.virtual('otherParticipant').get(function() {
  // This would be set in controller based on current user
  return null;
});

// Method to mark as read for a user
conversationSchema.methods.markAsRead = async function(userId) {
  const userUnread = this.unreadCounts.find(u => u.userId.equals(userId));
  if (userUnread) {
    userUnread.count = 0;
    await this.save();
  }
};

// Method to increment unread count for participants except sender
conversationSchema.methods.incrementUnreadCount = async function(senderId) {
  for (const unread of this.unreadCounts) {
    if (!unread.userId.equals(senderId)) {
      unread.count += 1;
    }
  }
  
  this.lastActivity = new Date();
  await this.save();
};

// Static method to find or create conversation between two users
conversationSchema.statics.findOrCreateConversation = async function(userId1, userId2, bookingId = null) {
  const participants = [userId1, userId2].sort();
  
  let conversation = await this.findOne({
    participants: { $all: participants, $size: 2 }
  });
  
  if (!conversation) {
    conversation = new this({
      participants,
      booking: bookingId,
      unreadCounts: participants.map(userId => ({
        userId,
        count: 0
      }))
    });
    
    // Generate title if needed
    if (bookingId) {
      const Booking = mongoose.model('Booking');
      const booking = await Booking.findById(bookingId)
        .populate('destination', 'name')
        .populate('buddy', 'name')
        .populate('traveller', 'name');
      
      if (booking) {
        conversation.title = `Booking: ${booking.destination.name} with ${booking.buddy.name}`;
      }
    }
    
    await conversation.save();
  }
  
  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

export { Conversation, Message };