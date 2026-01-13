// backend/src/routes/buddy.routes.js
import express from 'express';
import { 
  getCurrentBuddyProfile,
  getBuddyById,
  updateBuddyAvailability,
  updateBuddyProfile,
  getAvailableBuddies,
  updateBuddySchedule,
  addTourPackage,
  getBuddyEarnings,
  getBuddyStats
} from '../controllers/buddy.controller.js';
import { auth, guideAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// =============== PUBLIC ROUTES ===============
// ĐẶT CÁC ROUTES CỤ THỂ TRƯỚC ROUTES CÓ THAM SỐ
router.get('/available', getAvailableBuddies);

// =============== PROTECTED ROUTES (CHO BUDDY) ===============
// Tạo một router con cho các routes cần authentication
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
// Route để xem profile của buddy bất kỳ (public)
router.get('/:buddyId', getBuddyById);

// =============== ADMIN/SPECIFIC BUDDY ROUTES ===============
// Routes có tham số buddyId (cần auth)
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

export default router;