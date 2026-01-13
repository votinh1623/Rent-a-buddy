// backend/src/controllers/buddy.controller.js
import mongoose from 'mongoose'; // THÊM DÒNG NÀY
import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';
import Review from '../models/review.model.js';

// Get current buddy profile (sử dụng req.user từ middleware auth)
export const getCurrentBuddyProfile = async (req, res) => {
  try {
    console.log('Getting current buddy profile for user:', req.user._id);
    
    const buddy = await User.findById(req.user._id)
      .select('-password -__v')
      .populate('relatedActivities', 'name')
      .populate('relatedDestination', 'name city')
      .populate('featuredReviews', 'rating comment');

    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (buddy.role !== 'tour-guide') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. User is not a tour guide'
      });
    }

    res.status(200).json({
      success: true,
      data: buddy
    });

  } catch (error) {
    console.error('Error fetching buddy profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buddy details',
      error: error.message
    });
  }
};


// Get buddy by ID (public access)
export const getBuddyById = async (req, res) => {
  try {
    const { buddyId } = req.params;
    
    // Kiểm tra xem buddyId có phải là ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(buddyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid buddy ID format'
      });
    }
    
    const buddy = await User.findById(buddyId)
      .select('-password -email -phoneNumber -verificationDocuments -__v')
      .populate('relatedActivities', 'name description')
      .populate('relatedDestination', 'name city coverImg')
      .populate('featuredReviews', 'rating comment createdAt')
      .lean();

    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }

    if (buddy.role !== 'tour-guide') {
      return res.status(404).json({
        success: false,
        message: 'User is not a tour guide'
      });
    }

    res.status(200).json({
      success: true,
      data: buddy
    });

  } catch (error) {
    console.error('Error fetching buddy by ID:', error);
    
    // Xử lý CastError
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid buddy ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching buddy details',
      error: error.message
    });
  }
};
// Get buddy statistics dashboard
export const getBuddyStats = async (req, res) => {
  try {
    console.log('Getting buddy stats for user:', req.user._id);
    
    const buddy = await User.findById(req.user._id);
    if (!buddy || buddy.role !== 'tour-guide') {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }
    
    // Đơn giản hóa: chỉ lấy các stats cơ bản từ user model
    const stats = {
      // Lấy từ user model
      totalEarnings: buddy.totalEarnings || 0,
      completedTours: buddy.completedBookings || 0,
      averageRating: buddy.rating?.average || 0,
      totalBookings: buddy.totalBookings || 0,
      pendingBookings: buddy.pendingBookings || 0,
      cancellationRate: buddy.cancellationRate || 0,
      
      // Tính toán đơn giản
      responseRate: buddy.totalBookings > 0 
        ? Math.round(((buddy.completedBookings || 0) / buddy.totalBookings) * 100)
        : 100,
      monthlyEarnings: 0, // Có thể tính sau
      weeklyEarnings: 0,
      todayBookings: 0,
      ranking: null
    };
    
    // Thêm thông tin availability
    const buddyInfo = {
      isAvailableNow: buddy.isAvailableNow,
      isVerified: buddy.isVerified,
      verificationStatus: {
        emailVerified: buddy.emailVerified || false,
        phoneVerified: buddy.phoneVerified || false,
        idVerified: buddy.idVerified || false,
        backgroundCheckVerified: buddy.backgroundCheckVerified || false
      }
    };
    
    res.status(200).json({
      success: true,
      data: {
        ...stats,
        buddyInfo
      }
    });
    
  } catch (error) {
    console.error('Error fetching buddy stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buddy statistics',
      error: error.message
    });
  }
};


// Helper function để lấy thống kê theo tháng
const getMonthlyStats = async (buddyId, months = 6) => {
  const monthlyStats = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const [earnings, bookings, completed] = await Promise.all([
      // Thu nhập tháng
      Booking.aggregate([
        {
          $match: {
            buddy: buddyId,
            status: 'completed',
            paymentStatus: 'paid',
            completionDate: {
              $gte: monthStart,
              $lte: monthEnd
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]),
      
      // Tổng booking tháng
      Booking.countDocuments({
        buddy: buddyId,
        startDate: {
          $gte: monthStart,
          $lte: monthEnd
        }
      }),
      
      // Booking hoàn thành tháng
      Booking.countDocuments({
        buddy: buddyId,
        status: 'completed',
        completionDate: {
          $gte: monthStart,
          $lte: monthEnd
        }
      })
    ]);
    
    const monthName = monthStart.toLocaleString('default', { month: 'short', year: '2-digit' });
    
    monthlyStats.push({
      month: monthName,
      earnings: earnings[0]?.total || 0,
      totalBookings: bookings,
      completedBookings: completed,
      cancellationRate: bookings > 0 ? Math.round(((bookings - completed) / bookings) * 100) : 0
    });
  }
  
  return monthlyStats;
};

// Helper function để lấy thống kê theo mùa
const getSeasonalStats = async (buddyId) => {
  const currentYear = new Date().getFullYear();
  const seasons = [
    { name: 'Spring', start: new Date(currentYear, 2, 1), end: new Date(currentYear, 4, 31) },
    { name: 'Summer', start: new Date(currentYear, 5, 1), end: new Date(currentYear, 7, 31) },
    { name: 'Fall', start: new Date(currentYear, 8, 1), end: new Date(currentYear, 10, 30) },
    { name: 'Winter', start: new Date(currentYear, 11, 1), end: new Date(currentYear + 1, 1, 28) }
  ];
  
  const seasonalStats = [];
  
  for (const season of seasons) {
    const [earnings, bookings, completed] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            buddy: buddyId,
            status: 'completed',
            paymentStatus: 'paid',
            startDate: {
              $gte: season.start,
              $lte: season.end
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]),
      
      Booking.countDocuments({
        buddy: buddyId,
        startDate: {
          $gte: season.start,
          $lte: season.end
        }
      }),
      
      Booking.countDocuments({
        buddy: buddyId,
        status: 'completed',
        startDate: {
          $gte: season.start,
          $lte: season.end
        }
      })
    ]);
    
    seasonalStats.push({
      season: season.name,
      earnings: earnings[0]?.total || 0,
      totalBookings: bookings,
      completedBookings: completed
    });
  }
  
  return seasonalStats;
};

// Update buddy availability
export const updateBuddyAvailability = async (req, res) => {
  try {
    const { buddyId } = req.params;
    const { isAvailableNow } = req.body;
    
    // Check authorization
    if (req.user._id.toString() !== buddyId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this buddy'
      });
    }
    
    const buddy = await User.findById(buddyId);
    if (!buddy || buddy.role !== 'tour-guide') {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }
    
    buddy.isAvailableNow = isAvailableNow;
    buddy.lastOnline = new Date();
    await buddy.save();
    
    res.status(200).json({
      success: true,
      message: `Availability updated to ${isAvailableNow ? 'available' : 'unavailable'}`,
      data: { 
        isAvailableNow: buddy.isAvailableNow,
        lastOnline: buddy.lastOnline 
      }
    });
  } catch (error) {
    console.error('Error updating buddy availability:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid buddy ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating buddy availability',
      error: error.message
    });
  }
};

// Update buddy profile
export const updateBuddyProfile = async (req, res) => {
  try {
    const updates = req.body;
    const buddyId = req.user._id;
    
    // Remove fields that shouldn't be updated directly
    const disallowedFields = ['_id', 'password', 'role', 'isVerified', 'rating', 'totalBookings', 'completedBookings', 'cancellationRate', 'createdAt', 'updatedAt'];
    disallowedFields.forEach(field => delete updates[field]);
    
    const buddy = await User.findById(buddyId);
    if (!buddy || buddy.role !== 'tour-guide') {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }
    
    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        buddy[key] = updates[key];
      }
    });
    
    await buddy.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: buddy
    });
    
  } catch (error) {
    console.error('Error updating buddy profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating buddy profile',
      error: error.message
    });
  }
};

// Get available buddies
export const getAvailableBuddies = async (req, res) => {
  try {
    const { 
      destinationId, 
      activityId, 
      minRating = 0,
      maxPrice,
      languages,
      page = 1,
      limit = 10
    } = req.query;
    
    let query = {
      role: 'tour-guide',
      isActive: true,
      isAvailableNow: true
    };
    
    // Filter by destination
    if (destinationId) {
      query.relatedDestination = destinationId;
    }
    
    // Filter by activity
    if (activityId) {
      query.relatedActivities = activityId;
    }
    
    // Filter by rating
    if (minRating > 0) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }
    
    // Filter by hourly rate
    if (maxPrice) {
      query.hourlyRate = { $lte: parseFloat(maxPrice) };
    }
    
    // Filter by languages
    if (languages) {
      const langArray = Array.isArray(languages) ? languages : [languages];
      query.languages = { $in: langArray };
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const [buddies, total] = await Promise.all([
      User.find(query)
        .select('-password -email -phoneNumber -verificationDocuments')
        .populate('relatedDestination', 'name city')
        .populate('relatedActivities', 'name')
        .sort({ 'rating.average': -1, totalBookings: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(total / limitNum);
    
    res.status(200).json({
      success: true,
      count: buddies.length,
      total,
      totalPages,
      currentPage: pageNum,
      data: buddies
    });
    
  } catch (error) {
    console.error('Error fetching available buddies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available buddies',
      error: error.message
    });
  }
};

// Update buddy schedule/availability hours
export const updateBuddySchedule = async (req, res) => {
  try {
    const { availability } = req.body;
    const buddyId = req.user._id;
    
    const buddy = await User.findById(buddyId);
    if (!buddy || buddy.role !== 'tour-guide') {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }
    
    // Validate availability format
    if (availability && typeof availability === 'object') {
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const newAvailability = new Map();
      
      Object.keys(availability).forEach(day => {
        if (validDays.includes(day)) {
          const timeSlots = availability[day];
          if (Array.isArray(timeSlots)) {
            // Validate time slot format (e.g., "09:00-12:00")
            const validSlots = timeSlots.filter(slot => {
              return typeof slot === 'string' && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot);
            });
            if (validSlots.length > 0) {
              newAvailability.set(day, validSlots);
            }
          }
        }
      });
      
      buddy.availability = newAvailability;
      await buddy.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: {
        availability: Object.fromEntries(buddy.availability)
      }
    });
    
  } catch (error) {
    console.error('Error updating buddy schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating buddy schedule',
      error: error.message
    });
  }
};

// Add tour package
export const addTourPackage = async (req, res) => {
  try {
    const packageData = req.body;
    const buddyId = req.user._id;
    
    const buddy = await User.findById(buddyId);
    if (!buddy || buddy.role !== 'tour-guide') {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }
    
    // Validate package data
    const newPackage = {
      name: packageData.name || 'Tour Package',
      description: packageData.description || '',
      duration: Math.min(Math.max(packageData.duration || 4, 1), 24),
      price: Math.max(packageData.price || 0, 0),
      includes: Array.isArray(packageData.includes) ? packageData.includes : [],
      isActive: packageData.isActive !== undefined ? packageData.isActive : true
    };
    
    buddy.tourPackages.push(newPackage);
    await buddy.save();
    
    const addedPackage = buddy.tourPackages[buddy.tourPackages.length - 1];
    
    res.status(201).json({
      success: true,
      message: 'Tour package added successfully',
      data: addedPackage
    });
    
  } catch (error) {
    console.error('Error adding tour package:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding tour package',
      error: error.message
    });
  }
};

// Get buddy earnings/revenue statistics
export const getBuddyEarnings = async (req, res) => {
  try {
    const { buddyId } = req.params;
    const { startDate, endDate } = req.query;
    
    const buddy = await User.findById(buddyId);
    if (!buddy || buddy.role !== 'tour-guide') {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }
    
    // Authorization check
    if (req.user._id.toString() !== buddyId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these earnings'
      });
    }
    
    // Import Booking model
    const Booking = (await import('../models/booking.model.js')).default;
    
    // Build query for completed bookings
    let bookingQuery = {
      buddy: buddyId,
      status: 'completed',
      paymentStatus: 'paid'
    };
    
    // Date range filter
    if (startDate || endDate) {
      bookingQuery.completionDate = {};
      if (startDate) {
        bookingQuery.completionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        bookingQuery.completionDate.$lte = new Date(endDate);
      }
    }
    
    // Get completed bookings for earnings calculation
    const completedBookings = await Booking.find(bookingQuery)
      .select('totalPrice completionDate')
      .sort({ completionDate: -1 });
    
    // Calculate earnings
    const totalEarnings = completedBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    
    // Calculate monthly earnings
    const monthlyEarnings = {};
    completedBookings.forEach(booking => {
      if (booking.completionDate) {
        const monthYear = booking.completionDate.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyEarnings[monthYear] = (monthlyEarnings[monthYear] || 0) + (booking.totalPrice || 0);
      }
    });
    
    // Format monthly earnings for chart
    const monthlyData = Object.entries(monthlyEarnings)
      .map(([month, earnings]) => ({ month, earnings }))
      .sort((a, b) => new Date(a.month) - new Date(b.month));
    
    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        totalBookings: completedBookings.length,
        averageEarningsPerBooking: completedBookings.length > 0 ? totalEarnings / completedBookings.length : 0,
        monthlyEarnings: monthlyData,
        recentBookings: completedBookings.slice(0, 10).map(b => ({
          date: b.completionDate,
          amount: b.totalPrice
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching buddy earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buddy earnings',
      error: error.message
    });
  }
};