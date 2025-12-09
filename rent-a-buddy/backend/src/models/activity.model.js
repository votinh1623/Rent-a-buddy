// backend/src/models/activity.model.js
import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: [
      'adventure',
      'culture',
      'food',
      'nature',
      'sports',
      'nightlife',
      'shopping',
      'photography',
      'history',
      'family',
      'romantic',
      'budget',
      'luxury',
      'wellness',
      'educational'
    ]
  },
  icon: {
    type: String,
    default: '🏃‍♂️'
  },
  color: {
    type: String,
    default: '#2563eb'
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;