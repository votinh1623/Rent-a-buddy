// backend/src/routes/conversation.route.js
import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { getConversations, findOrCreateConversation,getConversationById, getRecentConversations } from '../controllers/conversation.controller.js';

const router = express.Router();

router.get('/recent', auth, getRecentConversations); // Thêm dòng này
router.get('/', auth, getConversations);
router.post('/findOrCreate', auth, findOrCreateConversation);
router.get('/:id', auth, getConversationById);
export default router;