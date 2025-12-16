// backend/src/routes/buddy.routes.js
import express from 'express';
import {
  getAllBuddies,
  getBuddyById,
  updateBuddy,
  deleteBuddy,
  getBuddiesByDestination,
  getBuddiesByActivity,
  getOnlineBuddies,
  registerAsBuddy,
  getCurrentBuddyProfile,
  searchBuddies  // Thêm hàm mới
} from '../controllers/buddy.controller.js';
import { auth, adminAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (không cần auth)
router.get('/all', getAllBuddies); // Lấy tất cả buddies với filter
router.get('/search', searchBuddies); // Tìm kiếm buddies theo destination và activity
router.get('/online', getOnlineBuddies); // Lấy buddies đang online
router.get('/destination/:destinationId', getBuddiesByDestination); // Lấy buddies theo destination ID
router.get('/activity/:activityId', getBuddiesByActivity); // Lấy buddies theo activity ID
router.get('/:id', getBuddyById); // Lấy chi tiết một buddy

// Protected routes (cần auth)
router.post('/register', auth, registerAsBuddy); // Đăng ký trở thành buddy
router.get('/profile/me', auth, getCurrentBuddyProfile); // Lấy profile của buddy hiện tại
router.put('/:id', auth, updateBuddy); // Cập nhật buddy
router.delete('/:id', auth, adminAuth, deleteBuddy); // Xóa buddy (chỉ admin)

export default router;