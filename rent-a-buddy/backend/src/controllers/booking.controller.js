// backend/src/controllers/booking.controller.js
import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';
import Destination from '../models/destination.model.js';

export const createBooking = async (req, res) => {
  try {
    const { 
      buddy, // guide id
      destination,
      activities = [],
      startDate,
      startTime,
      duration,
      numberOfPeople,
      specialRequests,
      totalPrice,
      paymentMethod
    } = req.body;

    // Sử dụng travellerId từ user đã đăng nhập
    const traveller = req.user._id;

    // Validate required fields
    if (!buddy || !destination || !startDate || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Buddy ID, destination, start date, and duration are required'
      });
    }

    // Check if buddy exists and is a tour-guide
    const buddyUser = await User.findById(buddy);
    if (!buddyUser || buddyUser.role !== 'tour-guide') {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found or is not a tour guide'
      });
    }

    // Check if destination exists
    const destinationDoc = await Destination.findById(destination);
    if (!destinationDoc) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    // Check if activities exist
    if (activities && activities.length > 0) {
      const Activity = (await import('../models/activity.model.js')).default;
      const activityDocs = await Activity.find({ _id: { $in: activities } });
      if (activityDocs.length !== activities.length) {
        return res.status(404).json({
          success: false,
          message: 'Some activities not found'
        });
      }
    }

    // Parse start date and time
    const startDateTime = new Date(`${startDate}T${startTime || '09:00'}`);
    const endDate = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);

    // Check for overlapping bookings for the buddy
    const existingBookings = await Booking.find({
      buddy,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          startDate: { $lt: endDate },
          endDate: { $gt: startDateTime }
        }
      ]
    });

    if (existingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Buddy is not available for the selected time slot'
      });
    }

    // Calculate total price if not provided
    let finalPrice = totalPrice;
    if (!finalPrice) {
      finalPrice = buddyUser.hourlyRate * duration;
      if (numberOfPeople > 1) {
        finalPrice += (numberOfPeople - 1) * 5; // Additional $5 per extra person
      }
    }

    // Create booking
    const booking = new Booking({
      traveller,
      buddy,
      destination,
      activities,
      startDate: startDateTime,
      endDate,
      startTime: startTime || '09:00',
      duration,
      numberOfPeople: numberOfPeople || 1,
      specialRequests,
      totalPrice: finalPrice,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
      bookingDate: new Date()
    });

    await booking.save();

    // Populate để trả về thông tin đầy đủ
    const populatedBooking = await Booking.findById(booking._id)
      .populate('traveller', 'name email phoneNumber pfp')
      .populate('buddy', 'name email phoneNumber pfp rating hourlyRate languages bio')
      .populate('destination', 'name coverImg address city')
      .populate('activities', 'name description');

    res.status(201).json({
      success: true,
      message: 'Booking request sent successfully',
      data: populatedBooking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id)
      .populate('traveller', 'name email phoneNumber pfp')
      .populate('buddy', 'name email phoneNumber pfp rating hourlyRate languages bio')
      .populate('destination', 'name coverImg address city country')
      .populate('activities', 'name description price');

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
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, role, limit = 20, page = 1 } = req.query;

    let query = {};
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;
    
    // Determine if user is a buddy or traveller
    if (role === 'buddy') {
      query.buddy = userId;
    } else {
      query.traveller = userId;
    }

    // Filter by status if provided
    if (status && ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'].includes(status)) {
      query.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('traveller', 'name pfp')
        .populate('buddy', 'name pfp rating')
        .populate('destination', 'name coverImg')
        .sort({ startDate: -1, createdAt: -1 })
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
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason, cancelledBy } = req.body;

    if (!['confirmed', 'cancelled', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: confirmed, cancelled, completed, or rejected'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized (either buddy or traveller)
    const isBuddy = booking.buddy.equals(req.user._id);
    const isTraveller = booking.traveller.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isBuddy && !isTraveller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Validate status transitions
    const allowedTransitions = {
      pending: ['confirmed', 'cancelled', 'rejected'],
      confirmed: ['completed', 'cancelled'],
      cancelled: [],
      completed: [],
      rejected: []
    };

    if (!allowedTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${booking.status} to ${status}`
      });
    }

    // Specific validations
    if (status === 'confirmed' && !isBuddy && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only buddy can confirm a booking'
      });
    }

    if (status === 'rejected' && !isBuddy && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only buddy can reject a booking'
      });
    }

    if (status === 'cancelled' && cancelledBy) {
      if ((cancelledBy === 'traveller' && !isTraveller) || 
          (cancelledBy === 'buddy' && !isBuddy)) {
        return res.status(403).json({
          success: false,
          message: `Only ${cancelledBy} can cancel with this reason`
        });
      }
    }

    // Update booking with status-specific dates
    booking.status = status;
    
    if (status === 'confirmed') {
      booking.confirmationDate = new Date();
    } else if (status === 'cancelled') {
      booking.cancellationDate = new Date();
      booking.cancelledBy = cancelledBy || 'traveller';
      if (cancellationReason) {
        booking.cancellationReason = cancellationReason;
      }
      
      // Update buddy cancellation rate
      if (booking.buddy) {
        const buddy = await User.findById(booking.buddy);
        if (buddy && buddy.role === 'tour-guide') {
          buddy.totalBookings += 1;
          const newCancellationRate = ((buddy.cancellationRate * (buddy.totalBookings - 1) + 1) / buddy.totalBookings) * 100;
          buddy.cancellationRate = parseFloat(newCancellationRate.toFixed(2));
          await buddy.save();
        }
      }
    } else if (status === 'completed') {
      booking.completionDate = new Date();
      
      // Update buddy stats
      if (booking.buddy) {
        const buddy = await User.findById(booking.buddy);
        if (buddy && buddy.role === 'tour-guide') {
          buddy.completedBookings += 1;
          await buddy.save();
        }
      }
    } else if (status === 'rejected') {
      booking.cancelledBy = 'buddy';
      booking.cancellationDate = new Date();
      if (cancellationReason) {
        booking.cancellationReason = cancellationReason;
      }
    }

    await booking.save();

    // Populate và trả về booking đã update
    const updatedBooking = await Booking.findById(id)
      .populate('traveller', 'name pfp')
      .populate('buddy', 'name pfp');

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
      data: updatedBooking
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getBuddyAvailability = async (req, res) => {
  try {
    const { buddyId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const buddy = await User.findById(buddyId);
    if (!buddy || buddy.role !== 'tour-guide') {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }

    // Parse date
    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

    // Get buddy's booked time slots for the specified date
    const bookedSlots = await Booking.find({
      buddy: buddyId,
      status: { $in: ['pending', 'confirmed'] },
      startDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).select('startDate duration startTime');

    // Get buddy's availability from their profile
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const availableSlots = buddy.availability.get(dayOfWeek) || ['09:00-17:00']; // Default slot

    // Generate available time slots
    const timeSlots = [];
    availableSlots.forEach(slot => {
      const [start, end] = slot.split('-');
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);
      
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const slotTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        const slotDateTime = new Date(requestedDate);
        slotDateTime.setHours(currentHour, currentMinute);
        
        // Check if slot is booked
        const isBooked = bookedSlots.some(booking => {
          const bookingStart = booking.startDate;
          const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60 * 60 * 1000);
          return slotDateTime >= bookingStart && slotDateTime < bookingEnd;
        });
        
        timeSlots.push({
          time: slotTime,
          isAvailable: !isBooked,
          buddy: {
            name: buddy.name,
            hourlyRate: buddy.hourlyRate,
            rating: buddy.rating
          }
        });
        
        // Move to next hour (assuming 1-hour slots)
        currentHour += 1;
        if (currentHour === 24) break;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        buddy: {
          name: buddy.name,
          isAvailableNow: buddy.isAvailableNow,
          hourlyRate: buddy.hourlyRate,
          rating: buddy.rating
        },
        date: requestedDate.toISOString().split('T')[0],
        timeSlots,
        bookedSlots: bookedSlots.map(slot => ({
          startTime: slot.startTime,
          duration: slot.duration
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching buddy availability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const addReviewToBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, anonymous = false } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the traveller who made the booking
    if (!booking.traveller.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the traveller can add a review'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed bookings'
      });
    }

    // Check if review already exists (if you add review field to booking model)
    if (booking.review) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Create a separate review (you might want to create a Review model)
    // For now, update buddy's rating directly
    const buddy = await User.findById(booking.buddy);
    if (buddy && buddy.role === 'tour-guide') {
      const newAverage = buddy.updateRating(rating);
      await buddy.save();
    }

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        rating,
        comment,
        anonymous,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getBuddyStatistics = async (req, res) => {
  try {
    const { buddyId } = req.params;

    const buddy = await User.findById(buddyId);
    if (!buddy || buddy.role !== 'tour-guide') {
      return res.status(404).json({
        success: false,
        message: 'Buddy not found'
      });
    }

    const statistics = await Booking.aggregate([
      { $match: { buddy: buddy._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalPrice', 0] } }
        }
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: '$count' },
          completedBookings: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'completed'] }, '$count', 0]
            }
          },
          pendingBookings: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'pending'] }, '$count', 0]
            }
          },
          cancelledBookings: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'cancelled'] }, '$count', 0]
            }
          },
          rejectedBookings: {
            $sum: {
              $cond: [{ $eq: ['$_id', 'rejected'] }, '$count', 0]
            }
          },
          totalRevenue: { $sum: '$totalRevenue' },
          statuses: { $push: { status: '$_id', count: '$count' } }
        }
      }
    ]);

    // Calculate monthly statistics (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Booking.aggregate([
      {
        $match: {
          buddy: buddy._id,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          bookings: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$totalPrice', 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const result = {
      totalBookings: statistics[0]?.totalBookings || 0,
      completedBookings: statistics[0]?.completedBookings || 0,
      pendingBookings: statistics[0]?.pendingBookings || 0,
      cancelledBookings: statistics[0]?.cancelledBookings || 0,
      rejectedBookings: statistics[0]?.rejectedBookings || 0,
      totalRevenue: statistics[0]?.totalRevenue || 0,
      averageBookingValue: statistics[0]?.totalRevenue / (statistics[0]?.completedBookings || 1),
      monthlyStats: monthlyStats.map(stat => ({
        month: `${stat._id.month}/${stat._id.year}`,
        bookings: stat.bookings,
        revenue: stat.revenue
      })),
      buddyInfo: {
        name: buddy.name,
        hourlyRate: buddy.hourlyRate,
        rating: buddy.rating,
        totalBookings: buddy.totalBookings,
        completedBookings: buddy.completedBookings,
        cancellationRate: buddy.cancellationRate,
        yearsOfExperience: buddy.yearsOfExperience
      }
    };

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching buddy statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const updateBookingPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, transactionId, paymentMethod } = req.body;

    if (!['pending', 'paid', 'refunded', 'failed'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only traveller or admin can update payment
    const isTraveller = booking.traveller.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isTraveller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update payment'
      });
    }

    // Update payment info
    booking.paymentStatus = paymentStatus;
    if (transactionId) booking.transactionId = transactionId;
    if (paymentMethod) booking.paymentMethod = paymentMethod;

    // If payment is paid and booking is pending, auto-confirm?
    if (paymentStatus === 'paid' && booking.status === 'pending') {
      // Optional: auto-confirm on payment
      // booking.status = 'confirmed';
      // booking.confirmationDate = new Date();
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};