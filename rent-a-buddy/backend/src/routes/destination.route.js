// backend/src/routes/destination.route.js
import express from 'express';
import {
  createDestination,
  getAllDestinations,
  getDestinationsByIds,
  updateDestination,
  deleteDestination,
  addActivityToDestination,
  removeActivityFromDestination,
  getGuidesForDestination,
  getActivitiesByDestination,
  addDestinationToGuide,
  removeDestinationFromGuide,
  getGuidesByDestination,
  bulkAddDestinationsToGuide
} from '../controllers/destination.controller.js';
import { auth, adminAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getAllDestinations);
router.get('/by-ids', getDestinationsByIds);
router.get('/:destinationId/activities', getActivitiesByDestination);
router.get('/:destinationId/guides', getGuidesForDestination); // Guides with matching activities
router.get('/:destinationId/guides-by-destination', getGuidesByDestination); // Guides who specifically added this destination

// Protected routes (require authentication)
router.post('/add-to-guide', auth, addDestinationToGuide); // Add destination to guide's profile
router.post('/remove-from-guide', auth, removeDestinationFromGuide); // Remove destination from guide's profile
router.post('/bulk-add-to-guide', auth, bulkAddDestinationsToGuide); // Bulk add destinations to guide

// Admin only routes
router.post('/', auth, adminAuth, createDestination);
router.put('/:id', auth, adminAuth, updateDestination);
router.delete('/:id', auth, adminAuth, deleteDestination);
router.post('/add-activity', auth, adminAuth, addActivityToDestination);
router.post('/remove-activity', auth, adminAuth, removeActivityFromDestination);

export default router;