import express from 'express';
import { getMessages, sendMessageHTTP } from '../controllers/message.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// QUAN TRỌNG: Đặt route cụ thể TRƯỚC route có tham số
router.post('/create', auth, sendMessageHTTP);  // ĐẶT TRƯỚC

// Route có tham số phải đặt SAU
router.get('/:conversationId', auth, getMessages);  // ĐẶT SAU

export default router;