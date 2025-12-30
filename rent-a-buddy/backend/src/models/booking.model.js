// backend/src/models/booking.model.js (updated)
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  traveller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buddy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: true
  },
  activities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  startTime: String,
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 24
  },
  numberOfPeople: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  specialRequests: String,
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  confirmationDate: Date,
  completionDate: Date,
  cancellationDate: Date,
  cancelledBy: {
    type: String,
    enum: ['traveller', 'buddy', 'system', '']
  },
  cancellationReason: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: String,
  transactionId: String,
  
  // Optional: Add review field to booking
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    anonymous: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date
    }
  },
  hasReview: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
bookingSchema.index({ traveller: 1, status: 1 });
bookingSchema.index({ buddy: 1, status: 1 });
bookingSchema.index({ startDate: 1 });
bookingSchema.index({ status: 1, bookingDate: 1 });
bookingSchema.index({ 'review.rating': 1 });

// Virtual for formatted dates
bookingSchema.virtual('formattedStartDate').get(function() {
  return this.startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Virtual for checking if booking is upcoming
bookingSchema.virtual('isUpcoming').get(function() {
  return this.status === 'confirmed' && this.startDate > new Date();
});

// Virtual for checking if booking is in progress
bookingSchema.virtual('isInProgress').get(function() {
  const now = new Date();
  return this.status === 'confirmed' && 
         this.startDate <= now && 
         (!this.endDate || this.endDate >= now);
});

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  if (this.startDate && this.duration && !this.endDate) {
    this.endDate = new Date(this.startDate.getTime() + this.duration * 60 * 60 * 1000);
  }
  
  if (this.review && this.review.rating) {
    this.hasReview = true;
  }
  
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;