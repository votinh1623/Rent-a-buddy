import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
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
    ref: 'Destination'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 1000
  },
  response: {
    comment: String,
    respondedAt: Date
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  images: [String]
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ buddy: 1, createdAt: -1 });
reviewSchema.index({ traveller: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isFeatured: 1 });

// Ensure one review per booking
reviewSchema.index({ booking: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;