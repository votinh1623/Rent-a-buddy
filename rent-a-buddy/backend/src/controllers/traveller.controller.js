import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';
import Review from '../models/review.model.js';
import Activity from '../models/activity.model.js';
import Destination from '../models/destination.model.js';
import mongoose from 'mongoose';

// @desc    Get traveller profile
// @route   GET /api/travellers/profile
// @access  Private (Traveller only)
export const getTravellerProfile = async (req, res) => {
  try {
    const travellerId = req.user._id;
    
    const traveller = await User.findById(travellerId)
      .select('-password')
      .populate('relatedActivities', 'name icon category')
      .populate('relatedDestination', 'name city country image');
    
    if (!traveller) {
      return res.status(404).json({
        success: false,
        message: 'Traveller not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: traveller
    });
  } catch (error) {
    console.error('Get traveller profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update traveller profile
// @route   PUT /api/travellers/profile
// @access  Private (Traveller only)
export const updateTravellerProfile = async (req, res) => {
  try {
    const travellerId = req.user._id;
    const updateData = req.body;
    
    // Fields that can be updated by traveller
    const allowedUpdates = [
      'name',
      'pfp',
      'address',
      'gender',
      'relatedActivities',
      'relatedDestination'
    ];
    
    // Filter update data
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdates[field] = updateData[field];
      }
    });
    
    const updatedTraveller = await User.findByIdAndUpdate(
      travellerId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedTraveller) {
      return res.status(404).json({
        success: false,
        message: 'Traveller not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedTraveller
    });
  } catch (error) {
    console.error('Update traveller profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get traveller's bookings
// @route   GET /api/travellers/bookings
// @access  Private (Traveller only)
export const getTravellerBookings = async (req, res) => {
  try {
    const travellerId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { traveller: travellerId };
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const bookings = await Booking.find(query)
      .populate('buddy', 'name pfp rating languages specialties')
      .populate('destination', 'name city country')
      .populate('activities', 'name icon')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Booking.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get traveller bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get upcoming bookings for traveller
// @route   GET /api/travellers/bookings/upcoming
// @access  Private (Traveller only)
export const getUpcomingBookings = async (req, res) => {
  try {
    const travellerId = req.user._id;
    const currentDate = new Date();
    
    const upcomingBookings = await Booking.find({
      traveller: travellerId,
      status: { $in: ['confirmed', 'pending'] },
      startDate: { $gte: currentDate }
    })
    .populate('buddy', 'name pfp rating languages phoneNumber')
    .populate('destination', 'name city')
    .sort({ startDate: 1 })
    .limit(5);
    
    res.status(200).json({
      success: true,
      data: upcomingBookings
    });
  } catch (error) {
    console.error('Get upcoming bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get booking details
// @route   GET /api/travellers/bookings/:bookingId
// @access  Private (Traveller only)
export const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const travellerId = req.user._id;
    
    const booking = await Booking.findOne({
      _id: bookingId,
      traveller: travellerId
    })
    .populate('buddy', 'name pfp rating bio languages specialties certifications phoneNumber transportation')
    .populate('destination', 'name city country description image')
    .populate('activities', 'name description icon');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create a review for a completed booking
// @route   POST /api/travellers/bookings/:bookingId/review
// @access  Private (Traveller only)
export const createReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const travellerId = req.user._id;
    const { rating, comment } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Check if booking exists and is completed
    const booking = await Booking.findOne({
      _id: bookingId,
      traveller: travellerId,
      status: 'completed'
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or not completed'
      });
    }
    
    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }
    
    // Create review
    const review = await Review.create({
      booking: bookingId,
      traveller: travellerId,
      buddy: booking.buddy,
      rating,
      comment,
      destination: booking.destination
    });
    
    // Update buddy's rating
    const buddy = await User.findById(booking.buddy);
    if (buddy) {
      await buddy.updateRating(rating);
      await buddy.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search for available buddies
// @route   POST /api/travellers/search-buddies
// @access  Private (Traveller only)
export const searchBuddies = async (req, res) => {
  try {
    const {
      destination,
      activities = [],
      languages = [],
      date,
      minRating = 0,
      maxHourlyRate,
      specialties = [],
      transportation = []
    } = req.body;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {
      role: 'tour-guide',
      isActive: true,
      isVerified: true,
      'rating.average': { $gte: minRating }
    };
    
    // Add destination filter
    if (destination && mongoose.Types.ObjectId.isValid(destination)) {
      query.relatedDestination = destination;
    }
    
    // Add activities filter
    if (activities.length > 0 && mongoose.Types.ObjectId.isValid(activities[0])) {
      query.relatedActivities = { $in: activities };
    }
    
    // Add languages filter
    if (languages.length > 0) {
      query.languages = { $in: languages };
    }
    
    // Add specialties filter
    if (specialties.length > 0) {
      query.specialties = { $in: specialties };
    }
    
    // Add transportation filter
    if (transportation.length > 0) {
      query.transportation = { $in: transportation };
    }
    
    // Add hourly rate filter
    if (maxHourlyRate) {
      query.hourlyRate = { $lte: maxHourlyRate };
    }
    
    // Execute query with sorting
    const buddies = await User.find(query)
      .select('-password -verificationDocuments')
      .populate('relatedActivities', 'name icon category')
      .populate('relatedDestination', 'name city country')
      .sort({ 'rating.average': -1, totalBookings: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: buddies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search buddies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get buddy details
// @route   GET /api/travellers/buddies/:buddyId
// @access  Private (Traveller only)
export const getBuddyDetails = async (req, res) => {
  try {
    const { buddyId } = req.params;
    
    const buddy = await User.findOne({
      _id: buddyId,
      role: 'tour-guide',
      isActive: true
    })
    .select('-password -verificationDocuments')
    .populate('relatedActivities', 'name icon category')
    .populate('relatedDestination', 'name city country')
    .populate('featuredReviews');
    
    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }
    
    // Get buddy's reviews
    const reviews = await Review.find({ buddy: buddyId })
      .populate('traveller', 'name pfp')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get buddy's availability for next 7 days
    const availability = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    
    days.forEach(day => {
      if (buddy.availability && buddy.availability.get(day)) {
        availability[day] = buddy.availability.get(day);
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        buddy,
        reviews,
        availability
      }
    });
  } catch (error) {
    console.error('Get buddy details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Check buddy availability for specific date/time
// @route   POST /api/travellers/buddies/:buddyId/check-availability
// @access  Private (Traveller only)
export const checkBuddyAvailability = async (req, res) => {
  try {
    const { buddyId } = req.params;
    const { date, startTime, duration } = req.body;
    
    const buddy = await User.findById(buddyId);
    
    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }
    
    // Parse date and time
    const requestedDate = new Date(date);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][requestedDate.getDay()];
    
    // Check if buddy has availability for this day
    const dayAvailability = buddy.availability.get(dayOfWeek);
    if (!dayAvailability || dayAvailability.length === 0) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Buddy is not available on this day'
      });
    }
    
    // Check if requested time slot is within buddy's availability
    const isAvailable = dayAvailability.some(timeSlot => {
      const [slotStart, slotEnd] = timeSlot.split('-');
      return startTime >= slotStart && startTime < slotEnd;
    });
    
    if (!isAvailable) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Buddy is not available at this time'
      });
    }
    
    // Check for existing bookings at this time
    const existingBooking = await Booking.findOne({
      buddy: buddyId,
      startDate: {
        $gte: new Date(`${date}T00:00:00`),
        $lt: new Date(`${date}T23:59:59`)
      },
      status: { $in: ['confirmed', 'pending'] }
    });
    
    if (existingBooking) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Buddy already has a booking at this time'
      });
    }
    
    res.status(200).json({
      success: true,
      available: true,
      message: 'Buddy is available'
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create booking request
// @route   POST /api/travellers/bookings
// @access  Private (Traveller only)
export const createBooking = async (req, res) => {
  try {
    const travellerId = req.user._id;
    const {
      buddyId,
      destinationId,
      activities = [],
      startDate,
      endDate,
      startTime,
      duration,
      numberOfPeople,
      specialRequests,
      totalPrice
    } = req.body;
    
    // Validate required fields
    if (!buddyId || !destinationId || !startDate || !duration || !totalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if buddy exists and is available
    const buddy = await User.findOne({
      _id: buddyId,
      role: 'tour-guide',
      isActive: true
    });
    
    if (!buddy) {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }
    
    // Create booking
    const booking = await Booking.create({
      traveller: travellerId,
      buddy: buddyId,
      destination: destinationId,
      activities,
      startDate,
      endDate,
      startTime,
      duration,
      numberOfPeople: numberOfPeople || 1,
      specialRequests,
      totalPrice,
      status: 'pending',
      bookingDate: new Date()
    });
    
    // Update buddy's total bookings count
    buddy.totalBookings += 1;
    await buddy.save();
    
    res.status(201).json({
      success: true,
      message: 'Booking request sent successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/travellers/bookings/:bookingId/cancel
// @access  Private (Traveller only)
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const travellerId = req.user._id;
    
    const booking = await Booking.findOne({
      _id: bookingId,
      traveller: travellerId,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or cannot be cancelled'
      });
    }
    
    // Update booking status
    booking.status = 'cancelled';
    booking.cancellationDate = new Date();
    booking.cancelledBy = 'traveller';
    await booking.save();
    
    // Update buddy's cancellation rate
    const buddy = await User.findById(booking.buddy);
    if (buddy) {
      buddy.totalBookings = Math.max(0, buddy.totalBookings - 1);
      // Calculate new cancellation rate
      const totalProcessedBookings = buddy.completedBookings + 1; // +1 for this cancelled booking
      const cancelledCount = (buddy.cancellationRate * totalProcessedBookings / 100) + 1;
      buddy.cancellationRate = (cancelledCount / (totalProcessedBookings + 1)) * 100;
      await buddy.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get traveller's reviews
// @route   GET /api/travellers/reviews
// @access  Private (Traveller only)
export const getTravellerReviews = async (req, res) => {
  try {
    const travellerId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find({ traveller: travellerId })
      .populate('buddy', 'name pfp')
      .populate('destination', 'name city')
      .populate('booking', 'startDate duration')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments({ traveller: travellerId });
    
    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get traveller reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get activities and destinations for preferences
// @route   GET /api/travellers/preferences
// @access  Private (Traveller only)
export const getPreferencesData = async (req, res) => {
  try {
    const activities = await Activity.find({ isActive: true })
      .select('name icon category color isPopular')
      .sort({ isPopular: -1, name: 1 });
    
    const destinations = await Destination.find({ isActive: true })
      .select('name city country image description')
      .sort({ isPopular: -1, name: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        activities,
        destinations
      }
    });
  } catch (error) {
    console.error('Get preferences data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update traveller preferences
// @route   PUT /api/travellers/preferences
// @access  Private (Traveller only)
export const updatePreferences = async (req, res) => {
  try {
    const travellerId = req.user._id;
    const { activities, destinations } = req.body;
    
    const updateData = {};
    
    if (activities) {
      updateData.relatedActivities = activities;
    }
    
    if (destinations) {
      updateData.relatedDestination = destinations;
    }
    
    const updatedTraveller = await User.findByIdAndUpdate(
      travellerId,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedTraveller
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get recommended buddies based on preferences
// @route   GET /api/travellers/recommended-buddies
// @access  Private (Traveller only)
export const getRecommendedBuddies = async (req, res) => {
  try {
    const travellerId = req.user._id;
    
    // Get traveller's preferences
    const traveller = await User.findById(travellerId)
      .select('relatedActivities relatedDestination');
    
    if (!traveller) {
      return res.status(404).json({
        success: false,
        message: 'Traveller not found'
      });
    }
    
    const query = {
      role: 'tour-guide',
      isActive: true,
      isVerified: true
    };
    
    // Add preferences to query if they exist
    if (traveller.relatedActivities && traveller.relatedActivities.length > 0) {
      query.relatedActivities = { $in: traveller.relatedActivities };
    }
    
    if (traveller.relatedDestination && traveller.relatedDestination.length > 0) {
      query.relatedDestination = { $in: traveller.relatedDestination };
    }
    
    // Get recommended buddies
    const recommendedBuddies = await User.find(query)
      .select('-password -verificationDocuments')
      .populate('relatedActivities', 'name icon category')
      .populate('relatedDestination', 'name city country')
      .sort({ 'rating.average': -1, isAvailableNow: -1 })
      .limit(6);
    
    res.status(200).json({
      success: true,
      data: recommendedBuddies
    });
  } catch (error) {
    console.error('Get recommended buddies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};