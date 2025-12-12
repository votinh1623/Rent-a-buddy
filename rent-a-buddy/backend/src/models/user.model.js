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
    enum: ['guest', 'traveler', 'tour-guide', 'admin'],
    default: 'guest'
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
  lastOnline: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  relatedDestination: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination'
  }
],
},
 {
  timestamps: true
});

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

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;