// backend/src/models/destination.model.js
import mongoose from 'mongoose';

const destinationSchema = new mongoose.Schema({
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
  city: {
    type: String,
    required: true,
    trim: true,
    default: 'Vietnam'
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'Vietnam'
  },
  coverImg: {
    type: String,
    required: true,
    default: ''
  },
  activities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  }],
  location: {
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    }
  },
  address: {
    type: String,
    trim: true
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

const Destination = mongoose.model('Destination', destinationSchema);

export default Destination;