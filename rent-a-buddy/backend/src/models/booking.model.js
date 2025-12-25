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
  transactionId: String
}, {
  timestamps: true
});

// Indexes for performance
bookingSchema.index({ traveller: 1, status: 1 });
bookingSchema.index({ buddy: 1, status: 1 });
bookingSchema.index({ startDate: 1 });
bookingSchema.index({ status: 1, bookingDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;