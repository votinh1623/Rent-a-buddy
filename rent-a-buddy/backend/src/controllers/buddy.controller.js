// backend/src/controllers/buddy.controller.js
import User from '../models/user.model.js';
import Activity from '../models/activity.model.js';
import Destination from '../models/destination.model.js';
import mongoose from 'mongoose';

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
      .populate('relatedActivities', 'name description price duration requirements')
      .populate('relatedDestination', 'name description city country images')
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

    // Format response
    const responseData = {
      ...buddy.toObject(),
      rating: {
        average: buddy.rating?.average || 0,
        count: buddy.rating?.count || 0,
        stars: '★'.repeat(Math.floor(buddy.rating?.average || 0)) + 
               '☆'.repeat(5 - Math.floor(buddy.rating?.average || 0))
      }
    };

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