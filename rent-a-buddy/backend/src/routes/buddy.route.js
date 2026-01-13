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
  updateBuddyAvailability,
  updateBuddyProfile,
  getAvailableBuddies,
  updateBuddySchedule,
  addTourPackage,
  getBuddyEarnings,
  getBuddyStats,
  searchBuddies  // Hàm này có trong buddy controller
} from '../controllers/buddy.controller.js';
import { auth, guideAuth, adminAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// =============== PUBLIC ROUTES ===============
// ĐẶT CÁC ROUTES CỤ THỂ TRƯỚC ROUTES CÓ THAM SỐ

// 1. Route cụ thể (không có tham số) - PHẢI ĐẶT TRƯỚC
router.get('/search', searchBuddies); // ĐẶT ĐẦU TIÊN
router.get('/available', getAvailableBuddies);
router.get('/all', getAllBuddies);
router.get('/online', getOnlineBuddies);

// 2. Routes với tham số cố định - ĐẶT TIẾP THEO
router.get('/destination/:destinationId', getBuddiesByDestination);
router.get('/activity/:activityId', getBuddiesByActivity);

// 3. Route đăng ký (POST) - không xung đột với GET
router.post('/register', auth, registerAsBuddy);

// =============== PROTECTED BUDDY ROUTES (CHO GUIDE) ===============
const buddyRouter = express.Router();

// Áp dụng auth middleware cho tất cả routes trong buddyRouter
buddyRouter.use(auth);
buddyRouter.use(guideAuth);

// Các routes cụ thể (KHÔNG có tham số)
buddyRouter.get('/profile/me', getCurrentBuddyProfile);
buddyRouter.get('/stats', getBuddyStats);
buddyRouter.patch('/profile/update', updateBuddyProfile);
buddyRouter.patch('/availability/update', (req, res) => {
  req.params.buddyId = req.user._id;
  updateBuddyAvailability(req, res);
});
buddyRouter.patch('/schedule/update', updateBuddySchedule);
buddyRouter.post('/tour-packages/add', addTourPackage);
buddyRouter.get('/earnings', (req, res) => {
  req.params.buddyId = req.user._id;
  getBuddyEarnings(req, res);
});

// Mount buddyRouter vào main router
router.use('/my', buddyRouter);

// =============== PUBLIC BUDDY PROFILE ROUTES ===============
// 4. Route profile public - ĐẶT SAU CÁC ROUTES CỤ THỂ
// XÓA route trùng lặp dưới đây
router.get('/:id', getBuddyById); // Chỉ giữ 1 route này

// =============== ADMIN/SPECIFIC BUDDY ROUTES ===============
// 5. Routes có tham số khác - ĐẶT SAU CÙNG
router.patch('/:buddyId/availability', auth, (req, res, next) => {
  // Kiểm tra quyền: admin hoặc chính buddy đó
  if (req.user.role !== 'admin' && req.params.buddyId !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. You can only update your own availability.' 
    });
  }
  next();
}, updateBuddyAvailability);

router.get('/:buddyId/earnings', auth, (req, res, next) => {
  // Kiểm tra quyền: admin hoặc chính buddy đó
  if (req.user.role !== 'admin' && req.params.buddyId !== req.user._id.toString()) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. You can only view your own earnings.' 
    });
  }
  next();
}, getBuddyEarnings);

// 6. Các route khác - ĐẶT CUỐI
router.put('/:id', auth, updateBuddy);
router.delete('/:id', auth, adminAuth, deleteBuddy);

export default router;