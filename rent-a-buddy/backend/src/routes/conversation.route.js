// backend/src/routes/conversation.routes.js
import express from 'express';
import {
  getUserConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  reactToMessage,
  getDirectConversation,
  archiveConversation
} from '../controllers/conversation.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get all conversations for current user
router.get('/', getUserConversations);

// Get or create conversation with specific user
router.get('/with/:userId', getOrCreateConversation);

// Get direct conversation (without creating)
router.get('/direct/:userId', getDirectConversation);

// Get messages in a conversation
router.get('/:conversationId/messages', getConversationMessages);

// Send a message
router.post('/:conversationId/messages', sendMessage);

// Mark all messages as read in conversation
router.post('/:conversationId/read', markMessagesAsRead);

// Message-specific operations
router.patch('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);
router.post('/messages/:messageId/react', reactToMessage);

// Archive conversation
router.post('/:conversationId/archive', archiveConversation);

// WebSocket/Real-time endpoints (conceptual)
router.get('/ws/token', (req, res) => {
  // This would return a token for WebSocket authentication
  // In a real implementation, you'd use something like socket.io with JWT
  res.json({
    success: true,
    data: {
      wsToken: 'temp-ws-token',
      userId: req.user._id
    }
  });
});

export default router;