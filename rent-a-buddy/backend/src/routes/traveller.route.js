import express from 'express';
import {
  getTravellerProfile,
  updateTravellerProfile,
  getTravellerBookings,
  getUpcomingBookings,
  getBookingDetails,
  createReview,
  searchBuddies,
  getBuddyDetails,
  checkBuddyAvailability,
  createBooking,
  cancelBooking,
  getTravellerReviews,
  getPreferencesData,
  updatePreferences,
  getRecommendedBuddies
} from '../controllers/traveller.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(auth);

// Middleware to check if user is a traveller
const isTraveller = (req, res, next) => {
  if (req.user.role !== 'traveller') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Traveller privileges required.'
    });
  }
  next();
};

router.use(isTraveller);

// Profile routes
router.route('/profile')
  .get(getTravellerProfile)
  .put(updateTravellerProfile);

// Preferences routes
router.route('/preferences')
  .get(getPreferencesData)
  .put(updatePreferences);

// Recommended buddies
router.get('/recommended-buddies', getRecommendedBuddies);

// Bookings routes
router.route('/bookings')
  .get(getTravellerBookings)
  .post(createBooking);

router.get('/bookings/upcoming', getUpcomingBookings);

router.route('/bookings/:bookingId')
  .get(getBookingDetails);

router.route('/bookings/:bookingId/cancel')
  .put(cancelBooking);

router.route('/bookings/:bookingId/review')
  .post(createReview);

// Reviews routes
router.get('/reviews', getTravellerReviews);

// Buddies search and details routes
router.post('/search-buddies', searchBuddies);

router.route('/buddies/:buddyId')
  .get(getBuddyDetails);

router.route('/buddies/:buddyId/check-availability')
  .post(checkBuddyAvailability);

export default router;