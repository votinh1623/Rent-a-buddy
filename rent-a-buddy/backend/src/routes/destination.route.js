// backend/src/routes/destination.route.js
import express from 'express';
import {
  createDestination,
  getAllDestinations,
  getDestinationById,
  //getDestinationsByCity,
  //getPopularDestinations,
  updateDestination,
  deleteDestination,
  addActivityToDestination,
  removeActivityFromDestination,
  //getNearbyDestinations,
  getGuidesForDestination,
  getActivitiesByDestination 
} from '../controllers/destination.controller.js';
import { auth, adminAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.get('/', getAllDestinations); // GET /api/destinations
// router.get('/popular', getPopularDestinations); // GET /api/destinations/popular
// router.get('/nearby', getNearbyDestinations); // GET /api/destinations/nearby
// router.get('/city/:city', getDestinationsByCity); // GET /api/destinations/city/:city
router.get('/:id', getDestinationById); // GET /api/destinations/:id
router.get('/:destinationId/guides', getGuidesForDestination); // GET /api/destinations/:destinationId/guides
router.get('/:destinationId/activities', getActivitiesByDestination);

// ==================== ADMIN ROUTES ====================
router.post('/', auth, adminAuth, createDestination); // POST /api/destinations
router.put('/:id', auth, adminAuth, updateDestination); // PUT /api/destinations/:id
router.delete('/:id', auth, adminAuth, deleteDestination); // DELETE /api/destinations/:id
router.post('/add-activity', auth, adminAuth, addActivityToDestination); // POST /api/destinations/add-activity
router.delete('/remove-activity', auth, adminAuth, removeActivityFromDestination); // DELETE /api/destinations/remove-activity

export default router;