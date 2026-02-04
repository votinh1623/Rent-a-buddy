// backend/src/controllers/buddy.controller.js
import User from '../models/user.model.js';
import Activity from '../models/activity.model.js';
import Destination from '../models/destination.model.js';
import mongoose from 'mongoose';
import Booking from '../models/booking.model.js';
import Review from '../models/review.model.js';
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

    // Validation
    if (typeof isAvailableNow !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailableNow must be a boolean'
      });
    }

    // Authorization
    if (req.user._id.toString() !== buddyId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this buddy'
      });
    }

    // Update directly using updateOne for reliability
    const updateResult = await User.updateOne(
      { _id: buddyId, role: 'tour-guide' },
      {
        $set: {
          isAvailableNow: isAvailableNow,
          lastOnline: new Date()
        }
      }
    );

    // Check if update was successful
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }

    // Get updated document
    const updatedUser = await User.findById(buddyId);

    res.status(200).json({
      success: true,
      message: `Availability updated to ${isAvailableNow ? 'available' : 'unavailable'}`,
      data: {
        isAvailableNow: updatedUser.isAvailableNow,
        lastOnline: updatedUser.lastOnline
      }
    });

  } catch (error) {
    console.error('Error updating buddy availability:', error);
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
// Đăng ký trở thành buddy (tour-guide)
export const registerAsBuddy = async (req, res) => {
  try {
    const userId = req.user._id;

    // Kiểm tra xem user đã là buddy chưa
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'tour-guide') {
      return res.status(400).json({
        success: false,
        message: 'You are already registered as a buddy'
      });
    }

    // Cập nhật role thành tour-guide và thêm thông tin cơ bản
    const { bio, hourlyRate, languages, specialties, phoneNumber } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        role: 'tour-guide',
        bio: bio || '',
        hourlyRate: hourlyRate || 0,
        languages: languages || [],
        specialties: specialties || [],
        phoneNumber: phoneNumber || '',
        isVerified: false, // Mặc định chưa verified
        availability: new Map(),
        isAvailableNow: false,
        lastOnline: new Date()
      },
      { new: true }
    ).select('-password -verificationDocuments');

    res.status(200).json({
      success: true,
      message: 'Successfully registered as a buddy',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error registering as buddy:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering as buddy',
      error: error.message
    });
  }
};

// Lấy profile của buddy hiện tại
export const getCurrentBuddyProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const buddy = await User.findOne({
      _id: userId,
      role: 'tour-guide',
      isActive: true
    })
      .populate('relatedActivities', 'name description price duration')
      .populate('relatedDestination', 'name city country')
      .populate('featuredReviews', 'rating comment user date')
      .select('-password');

    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: 'You are not registered as a buddy'
      });
    }

    res.status(200).json({
      success: true,
      data: buddy
    });
  } catch (error) {
    console.error('Error getting current buddy profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buddy profile',
      error: error.message
    });
  }
};

// Lấy danh sách tất cả buddies (tour-guides)
export const getAllBuddies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      destination,
      activity,
      sortBy = 'rating',
      sortOrder = 'desc',
      minRating = 0,
      maxPrice,
      minPrice,
      languages,
      availability = false,
      verifiedOnly = false
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { role: 'tour-guide', isActive: true };

    // Search by name or bio
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by rating
    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }

    // Filter by price
    if (minPrice || maxPrice) {
      query.hourlyRate = {};
      if (minPrice) query.hourlyRate.$gte = parseFloat(minPrice);
      if (maxPrice) query.hourlyRate.$lte = parseFloat(maxPrice);
    }

    // Filter by languages
    if (languages) {
      const langArray = languages.split(',').map(lang => lang.trim());
      query.languages = { $in: langArray };
    }

    // Filter by verified status
    if (verifiedOnly === 'true' || verifiedOnly === true) {
      query.isVerified = true;
    }

    // Filter by availability
    if (availability === 'true' || availability === true) {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      query.lastOnline = { $gte: fifteenMinutesAgo };
      query.isAvailableNow = true;
    }

    // Filter by destination
    if (destination) {
      if (mongoose.Types.ObjectId.isValid(destination)) {
        query.relatedDestination = destination;
      } else {
        const dest = await Destination.findOne({
          name: { $regex: new RegExp(`^${destination}$`, 'i') }
        });
        if (dest) {
          query.relatedDestination = dest._id;
        }
      }
    }

    // Filter by activity
    if (activity) {
      if (mongoose.Types.ObjectId.isValid(activity)) {
        query.relatedActivities = activity;
      } else {
        const act = await Activity.findOne({
          name: { $regex: new RegExp(`^${activity}$`, 'i') }
        });
        if (act) {
          query.relatedActivities = act._id;
        }
      }
    }

    // Sort options
    const sortOptions = {};
    if (sortBy === 'rating') {
      sortOptions['rating.average'] = sortOrder === 'desc' ? -1 : 1;
      sortOptions['rating.count'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'price') {
      sortOptions.hourlyRate = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'experience') {
      sortOptions.yearsOfExperience = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'bookings') {
      sortOptions.completedBookings = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Get buddies with pagination
    const buddies = await User.find(query)
      .populate('relatedActivities', 'name category')
      .populate('relatedDestination', 'name city')
      .select('-password -verificationDocuments -email -phoneNumber')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Format response
    const formattedBuddies = buddies.map(buddy => ({
      ...buddy,
      rating: {
        average: buddy.rating?.average || 0,
        count: buddy.rating?.count || 0,
        stars: '★'.repeat(Math.floor(buddy.rating?.average || 0)) +
          '☆'.repeat(5 - Math.floor(buddy.rating?.average || 0))
      }
    }));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: formattedBuddies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting buddies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buddies',
      error: error.message
    });
  }
};

// Lấy thông tin chi tiết một buddy
export const getBuddyById = async (req, res) => {
  try {
    const buddyId = req.params.id;

    const buddy = await User.findOne({
      _id: buddyId,
      role: 'tour-guide',
      isActive: true
    })
      .populate('relatedActivities', 'name description icon color category isPopular') // Thêm icon, color, category
      .populate('relatedDestination', 'name description city country coverImg location isPopular')
      .select('-password -verificationDocuments');

    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found or inactive'
      });
    }

    // Kiểm tra xem có phải là chủ tài khoản không
    const isOwner = req.user && req.user._id.toString() === buddyId;
    const isAdmin = req.user && req.user.role === 'admin';

    // Format response với activities đã populate
    const responseData = {
      ...buddy.toObject(),
      rating: {
        average: buddy.rating?.average || 0,
        count: buddy.rating?.count || 0,
        stars: '★'.repeat(Math.floor(buddy.rating?.average || 0)) +
          '☆'.repeat(5 - Math.floor(buddy.rating?.average || 0))
      }
    };

    // Đảm bảo activities có icon và color mặc định nếu không có
    if (responseData.relatedActivities) {
      responseData.relatedActivities = responseData.relatedActivities.map(activity => ({
        ...activity,
        icon: activity.icon || getDefaultIcon(activity.category),
        color: activity.color || getDefaultColor(activity.category)
      }));
    }

    // Ẩn thông tin nhạy cảm nếu không phải chủ tài khoản hoặc admin
    if (!isOwner && !isAdmin) {
      delete responseData.email;
      delete responseData.phoneNumber;
      delete responseData.cancellationRate;
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error getting buddy:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buddy details',
      error: error.message
    });
  }
};

// Helper functions để set default icon và color
const getDefaultIcon = (category) => {
  const defaultIcons = {
    'adventure': '🧗',
    'culture': '🎭',
    'food': '🍜',
    'nature': '🌿',
    'sports': '⚽',
    'nightlife': '🍻',
    'shopping': '🛍️',
    'photography': '📸',
    'history': '🏛️',
    'family': '👨‍👩‍👧‍👦',
    'romantic': '💖',
    'budget': '💰',
    'luxury': '💎',
    'wellness': '🧘',
    'educational': '📚',
    'default': '🏃‍♂️'
  };

  return defaultIcons[category] || defaultIcons.default;
};

const getDefaultColor = (category) => {
  const defaultColors = {
    'adventure': '#ef4444',
    'culture': '#8b5cf6',
    'food': '#f59e0b',
    'nature': '#10b981',
    'sports': '#ec4899',
    'nightlife': '#6366f1',
    'shopping': '#f97316',
    'photography': '#3b82f6',
    'history': '#dc2626',
    'family': '#06b6d4',
    'romantic': '#db2777',
    'budget': '#64748b',
    'luxury': '#fbbf24',
    'wellness': '#14b8a6',
    'educational': '#7c3aed',
    'default': '#2563eb'
  };

  return defaultColors[category] || defaultColors.default;
};

// Tìm kiếm buddies theo destination và activity
export const searchBuddies = async (req, res) => {
  try {
    const {
      destination,
      activities
    } = req.query;

    console.log('Search query:', { destination, activities }); // Debug log

    // Build base query
    const query = {
      role: 'tour-guide',
      isActive: true
    };

    // Xử lý destination (có thể là ID hoặc tên)
    if (destination) {
      if (mongoose.Types.ObjectId.isValid(destination)) {
        // Nếu là ObjectId hợp lệ
        query.relatedDestination = destination;
      } else {
        // Tìm destination theo tên
        const destinationObj = await mongoose.model('Destination').findOne({
          $or: [
            { name: { $regex: new RegExp(`^${destination}$`, 'i') } },
            { city: { $regex: new RegExp(`^${destination}$`, 'i') } }
          ],
          isActive: true
        });

        if (destinationObj) {
          query.relatedDestination = destinationObj._id;
        } else {
          // Nếu không tìm thấy destination, trả về empty array
          return res.status(200).json({
            success: true,
            data: [],
            count: 0,
            message: 'No destination found'
          });
        }
      }
    }

    // Xử lý activities (string hoặc array)
    if (activities) {
      let activityIds = [];

      // Xác định activities là string hay array
      if (typeof activities === 'string') {
        // Nếu là string, split bằng dấu phẩy
        const activityNames = activities.split(',').map(act => act.trim());

        // Tìm activity IDs từ tên
        for (const activityName of activityNames) {
          if (mongoose.Types.ObjectId.isValid(activityName)) {
            // Nếu là ObjectId
            activityIds.push(new mongoose.Types.ObjectId(activityName));
          } else {
            // Tìm activity theo tên
            const activity = await Activity.findOne({
              name: { $regex: new RegExp(`^${activityName}$`, 'i') },
              isActive: true
            });

            if (activity) {
              activityIds.push(activity._id);
            }
          }
        }
      } else if (Array.isArray(activities)) {
        // Nếu đã là array
        for (const activity of activities) {
          if (mongoose.Types.ObjectId.isValid(activity)) {
            activityIds.push(new mongoose.Types.ObjectId(activity));
          } else {
            const activityObj = await Activity.findOne({
              name: { $regex: new RegExp(`^${activity}$`, 'i') },
              isActive: true
            });

            if (activityObj) {
              activityIds.push(activityObj._id);
            }
          }
        }
      }

      console.log('Activity IDs found:', activityIds); // Debug log

      // Nếu tìm được activity IDs
      if (activityIds.length > 0) {
        // Tìm buddies có ít nhất một trong các activities này
        query.relatedActivities = { $in: activityIds };
      } else {
        // Nếu không tìm thấy activities hợp lệ, trả về empty array
        return res.status(200).json({
          success: true,
          data: [],
          count: 0,
          message: 'No valid activities found'
        });
      }
    }

    console.log('Final query:', JSON.stringify(query, null, 2)); // Debug log

    // Lấy danh sách buddies
    const buddies = await User.find(query)
      .populate('relatedActivities', 'name category icon color')
      .populate('relatedDestination', 'name city country coverImg')
      .select('-password -verificationDocuments -email -phoneNumber')
      .lean();

    console.log('Buddies found:', buddies.length); // Debug log

    // Format response
    const formattedBuddies = buddies.map(buddy => ({
      ...buddy,
      rating: {
        average: buddy.rating?.average || 0,
        count: buddy.rating?.count || 0,
        stars: '★'.repeat(Math.floor(buddy.rating?.average || 0)) +
          '☆'.repeat(5 - Math.floor(buddy.rating?.average || 0))
      }
    }));

    res.status(200).json({
      success: true,
      data: formattedBuddies,
      count: formattedBuddies.length,
      searchParams: {
        destination: destination || null,
        activities: activities || null,
        query: query
      }
    });

  } catch (error) {
    console.error('Error searching buddies:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching buddies',
      error: error.message
    });
  }
};

// Helper function để tìm destination ID theo tên (đơn giản)
const findDestinationIdByName = async (destinationName) => {
  // Giả sử bạn có Destination model
  // Nếu không, có thể import Destination model ở đầu file
  try {
    const Destination = mongoose.model('Destination');
    const destination = await Destination.findOne({
      $or: [
        { name: { $regex: new RegExp(destinationName, 'i') } },
        { city: { $regex: new RegExp(destinationName, 'i') } }
      ]
    }).select('_id');

    return destination ? destination._id : null;
  } catch (error) {
    console.error('Error finding destination:', error);
    return null;
  }
};

// Cập nhật thông tin buddy
export const updateBuddy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Kiểm tra quyền: chỉ buddy đó hoặc admin mới được update
    if (id !== userId.toString() && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    // Danh sách field có thể update
    let allowedUpdates = [
      'name',
      'pfp',
      'address',
      'gender',
      'bio',
      'hourlyRate',
      'languages',
      'certifications',
      'yearsOfExperience',
      'specialties',
      'phoneNumber',
      'availability',
      'isAvailableNow',
      'transportation',
      'relatedActivities',
      'relatedDestination'
    ];

    // Admin có thêm quyền
    if (userRole === 'admin') {
      allowedUpdates = allowedUpdates.concat([
        'isVerified',
        'isActive',
        'role',
        'rating',
        'totalBookings',
        'completedBookings',
        'cancellationRate'
      ]);
    }

    // Filter updates
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Cập nhật lastOnline
    updates.lastOnline = new Date();

    const buddy = await User.findOneAndUpdate(
      { _id: id, role: 'tour-guide' },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('relatedActivities', 'name')
      .populate('relatedDestination', 'name')
      .select('-password -verificationDocuments');

    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: buddy
    });
  } catch (error) {
    console.error('Error updating buddy:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Xóa buddy (soft delete)
export const deleteBuddy = async (req, res) => {
  try {
    const { id } = req.params;

    // Chỉ admin mới có thể xóa (đã được middleware adminAuth kiểm tra)
    const buddy = await User.findByIdAndUpdate(
      id,
      {
        isActive: false,
        lastOnline: new Date(),
        isAvailableNow: false
      },
      { new: true }
    ).select('-password -verificationDocuments');

    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Buddy deleted successfully',
      data: buddy
    });
  } catch (error) {
    console.error('Error deleting buddy:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting buddy',
      error: error.message
    });
  }
};

// Tìm buddies theo destination
export const getBuddiesByDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;
    const { limit = 20, verifiedOnly = false } = req.query;

    const query = {
      role: 'tour-guide',
      isActive: true,
      relatedDestination: destinationId
    };

    if (verifiedOnly === 'true' || verifiedOnly === true) {
      query.isVerified = true;
    }

    const buddies = await User.find(query)
      .populate('relatedActivities', 'name category')
      .select('-password -verificationDocuments -email -phoneNumber')
      .limit(parseInt(limit))
      .sort({ 'rating.average': -1, isVerified: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: buddies,
      count: buddies.length
    });
  } catch (error) {
    console.error('Error getting buddies by destination:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buddies by destination',
      error: error.message
    });
  }
};

// Tìm buddies theo activity
export const getBuddiesByActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { limit = 20, verifiedOnly = false } = req.query;

    const query = {
      role: 'tour-guide',
      isActive: true,
      relatedActivities: activityId
    };

    if (verifiedOnly === 'true' || verifiedOnly === true) {
      query.isVerified = true;
    }

    const buddies = await User.find(query)
      .populate('relatedDestination', 'name city')
      .select('-password -verificationDocuments -email -phoneNumber')
      .limit(parseInt(limit))
      .sort({ 'rating.average': -1, isVerified: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: buddies,
      count: buddies.length
    });
  } catch (error) {
    console.error('Error getting buddies by activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buddies by activity',
      error: error.message
    });
  }
};

// Lấy buddies online
export const getOnlineBuddies = async (req, res) => {
  try {
    const { limit = 10, verifiedOnly = false } = req.query;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const query = {
      role: 'tour-guide',
      isActive: true,
      lastOnline: { $gte: fifteenMinutesAgo },
      isAvailableNow: true
    };

    if (verifiedOnly === 'true' || verifiedOnly === true) {
      query.isVerified = true;
    }

    const buddies = await User.find(query)
      .select('name pfp bio rating hourlyRate languages yearsOfExperience isVerified relatedActivities relatedDestination lastOnline')
      .populate('relatedActivities', 'name')
      .populate('relatedDestination', 'name city')
      .limit(parseInt(limit))
      .sort({ lastOnline: -1, isVerified: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: buddies,
      count: buddies.length
    });
  } catch (error) {
    console.error('Error getting online buddies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching online buddies',
      error: error.message
    });
  }
};