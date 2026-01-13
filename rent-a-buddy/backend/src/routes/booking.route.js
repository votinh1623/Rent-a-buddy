// backend/src/routes/booking.routes.js
import express from 'express';
import {
  createBooking,
  getBookingById,
  getUserBookings,
  updateBookingStatus,
  getBuddyAvailability,
  addReviewToBooking,
  getBuddyStatistics,
  updateBookingPayment,
  getUpcomingBookings, // Thêm hàm này
  getBookingStats // Thêm hàm này
} from '../controllers/booking.controller.js';
import { auth, adminAuth } from '../middleware/auth.middleware.js';
import Booking from '../models/booking.model.js';

const router = express.Router();

// Middleware để check booking ownership (đặt ở đây để có thể dùng Booking model)
const checkBookingOwnership = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    req.booking = booking;
    const isTraveller = booking.traveller.equals(req.user._id);
    const isBuddy = booking.buddy.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isTraveller && !isBuddy && !isAdmin) {
      return res.status(403).json({ 
        message: 'Access denied. You can only access your own bookings.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking booking authorization:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware to check if user is traveller
const isTraveller = (req, res, next) => {
  if (!['traveller', 'guest'].includes(req.user.role)) {
    return res.status(403).json({ 
      message: 'Access denied. Only travellers and guests can perform this action.' 
    });
  }
  next();
};

// Middleware to check if user is buddy
const isBuddy = (req, res, next) => {
  if (req.user.role !== 'tour-guide') {
    return res.status(403).json({ 
      message: 'Access denied. Only buddies (tour guides) can perform this action.' 
    });
  }
  next();
};

// Middleware to check user ID access
const checkUserIdAccess = (req, res, next) => {
  if (req.params.userId !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. You can only access your own data.' 
    });
  }
  next();
};

// Middleware to check buddy statistics access
const checkBuddyStatsAccess = (req, res, next) => {
  const { buddyId } = req.params;
  
  if (!['admin', 'tour-guide'].includes(req.user.role)) {
    return res.status(403).json({ 
      message: 'Access denied. Only buddies and admins can view booking statistics.' 
    });
  }
  
  if (req.user.role === 'tour-guide' && buddyId !== req.user._id.toString()) {
    return res.status(403).json({ 
      message: 'Access denied. You can only view your own statistics.' 
    });
  }
  
  next();
};

// Middleware to check if user is review author
const checkReviewAuthor = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Only the traveller who made the booking can add a review
    if (!booking.traveller.equals(req.user._id)) {
      return res.status(403).json({ 
        message: 'Access denied. Only the traveller who made this booking can add a review.' 
      });
    }
    
    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ 
        message: 'Cannot review a booking that is not completed.' 
      });
    }
    
    req.booking = booking;
    next();
  } catch (error) {
    console.error('Error checking review authorization:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// =============== PUBLIC ROUTES ===============
router.get('/availability/:buddyId', getBuddyAvailability);

// =============== PROTECTED ROUTES ===============
router.use(auth);

// Các routes cụ thể PHẢI đứng trước routes có tham số động
// 1. Routes không có tham số (cụ thể)
router.post('/', isTraveller, createBooking);
router.get('/my-bookings/upcoming', getUpcomingBookings); // Thêm route này
router.get('/stats/my', getBookingStats); // Thêm route này

// 2. Routes có tham số (đứng sau)
router.get('/:id', checkBookingOwnership, getBookingById);
router.patch('/:id/status', checkBookingOwnership, updateBookingStatus);
router.patch('/:id/payment', checkBookingOwnership, updateBookingPayment);
router.post('/:id/review', checkReviewAuthor, addReviewToBooking);

// 3. Routes có tham số user ID
router.get('/user/:userId', checkUserIdAccess, getUserBookings);
router.get('/buddy/:buddyId/stats', checkBuddyStatsAccess, getBuddyStatistics);

// 4. Shortcut routes cho người dùng hiện tại
router.get('/my-bookings/buddy', isBuddy, (req, res) => {
  req.params.userId = req.user._id;
  req.query.role = 'buddy';
  getUserBookings(req, res);
});

router.get('/my-bookings/traveller', isTraveller, (req, res) => {
  req.params.userId = req.user._id;
  req.query.role = 'traveller';
  getUserBookings(req, res);
});

// 5. Admin routes
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status && ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'].includes(status)) {
      query.status = status;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;
    
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('traveller', 'name email')
        .populate('buddy', 'name email')
        .populate('destination', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(total / limitNum);
    
    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      totalPages,
      currentPage: pageNum,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;