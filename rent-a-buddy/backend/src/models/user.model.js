// backend/src/models/user.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['guest', 'traveller', 'tour-guide', 'admin'],
    default: 'traveller'
  },
  pfp: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  // Trường mới: chỉ áp dụng cho tour-guide
  relatedActivities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  }],
   relatedDestination: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination'
  }],
  lastOnline: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // === THÊM CÁC TRƯỜNG MỚI CHO TOUR-GUIDE ===
  // Thông tin rating và đánh giá
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: v => parseFloat(v.toFixed(1)) // Làm tròn 1 chữ số thập phân
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    },
    breakdown: {
      type: Map,
      of: Number,
      default: {
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0
      }
    }
  },
  
  // Thông tin chi tiết cho tour-guide
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  hourlyRate: {
    type: Number,
    min: 0,
    default: 0
  },
  languages: [{
    type: String,
    trim: true
  }],
  certifications: [{
    name: {
      type: String,
      trim: true
    },
    issuingOrganization: {
      type: String,
      trim: true
    },
    year: Number
  }],
  
  // Kinh nghiệm và chuyên môn
  yearsOfExperience: {
    type: Number,
    min: 0,
    default: 0
  },
  specialties: [{
    type: String,
    trim: true
  }],
  
  // Thông tin liên hệ và xác minh
  phoneNumber: {
    type: String,
    trim: true,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: String // URLs của document images
  }],
  
  // Tính khả dụng
  availability: {
    type: Map,
    of: [String], // Ví dụ: { "Monday": ["09:00-12:00", "14:00-18:00"] }
    default: {}
  },
  isAvailableNow: {
    type: Boolean,
    default: false
  },
  
  // Thống kê và hiệu suất
  totalBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  completedBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  cancellationRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Đánh giá nổi bật
  featuredReviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  
  // Phương tiện di chuyển
  transportation: [{
    type: String,
    enum: ['Walking', 'Bicycle', 'Motorbike', 'Car', 'Public Transport', '']
  }]
}, {
  timestamps: true
});

// Middleware để tự động cập nhật isAvailableNow dựa trên lastOnline
userSchema.pre('save', function(next) {
  if (this.role === 'tour-guide') {
    // Nếu lastOnline trong vòng 15 phút và có availability, coi như available
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    this.isAvailableNow = this.lastOnline >= fifteenMinutesAgo;
  }
  next();
});

// Phương thức tính rating mới
userSchema.methods.updateRating = function(newRating) {
  if (this.role !== 'tour-guide') {
    throw new Error('Only tour-guides can have ratings');
  }
  
  if (newRating < 1 || newRating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  // Cập nhật breakdown
  const starKey = newRating.toString();
  this.rating.breakdown.set(starKey, (this.rating.breakdown.get(starKey) || 0) + 1);
  
  // Tính average mới
  let totalScore = 0;
  let totalReviews = 0;
  
  this.rating.breakdown.forEach((count, star) => {
    totalScore += parseInt(star) * count;
    totalReviews += count;
  });
  
  this.rating.average = totalReviews > 0 ? totalScore / totalReviews : 0;
  this.rating.count = totalReviews;
  
  return this.rating.average;
};

// Phương thức để thêm certification
userSchema.methods.addCertification = function(name, organization, year) {
  if (this.role !== 'tour-guide') {
    throw new Error('Only tour-guides can have certifications');
  }
  
  this.certifications.push({
    name,
    issuingOrganization: organization,
    year
  });
};

// Phương thức để cập nhật availability
userSchema.methods.updateAvailability = function(day, timeSlots) {
  if (this.role !== 'tour-guide') {
    throw new Error('Only tour-guides can set availability');
  }
  
  if (!this.availability) {
    this.availability = new Map();
  }
  
  this.availability.set(day, timeSlots);
};

// Middleware để mã hóa password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Phương thức so sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual để lấy rating stars (ví dụ: 4.3/5)
userSchema.virtual('ratingStars').get(function() {
  if (this.role !== 'tour-guide') return null;
  return {
    average: this.rating.average,
    count: this.rating.count,
    stars: '★'.repeat(Math.floor(this.rating.average)) + '☆'.repeat(5 - Math.floor(this.rating.average))
  };
});

// Virtual để kiểm tra có phải là verified guide không
userSchema.virtual('isVerifiedGuide').get(function() {
  return this.role === 'tour-guide' && this.isVerified;
});
userSchema.virtual('destinationDetails', {
  ref: 'Destination',
  localField: 'relatedDestination',
  foreignField: '_id',
  justOne: false
});

// Để sử dụng virtual trong queries, thêm:
userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

// Index cho tìm kiếm và filter
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'rating.average': -1 });
userSchema.index({ hourlyRate: 1 });
userSchema.index({ languages: 1 });
userSchema.index({ relatedDestination: 1 });
userSchema.index({ relatedActivities: 1 });
userSchema.index({ lastOnline: -1, isAvailableNow: 1 });

const User = mongoose.model('User', userSchema);

export default User;