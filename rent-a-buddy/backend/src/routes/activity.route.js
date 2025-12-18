// backend/src/routes/activity.route.js
import express from 'express';
import {
  createActivity,
  getAllActivities,
  getActivitiesByCategory,
  getPopularActivities,
  addActivityToGuide,
  removeActivityFromGuide,
  getGuidesByActivity,
  getGuideActivities,
  updateActivity,
  deleteActivity,
  getMyActivities,
  getActivitiesByIds
} from '../controllers/activity.controller.js';
import { auth, adminAuth, guideAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
// Khách vãng lai có thể xem
router.get('/', getAllActivities); // GET /api/activities
router.get('/by-ids', getActivitiesByIds);
router.get('/popular', getPopularActivities); // GET /api/activities/popular
router.get('/category/:category', getActivitiesByCategory); // GET /api/activities/category/:category
router.get('/:activityId/guides', getGuidesByActivity); // GET /api/activities/:activityId/guides
router.get('/guide/:userId', getGuideActivities); // GET /api/activities/guide/:userId

// ==================== PROTECTED ROUTES ====================
// Cần đăng nhập + là tour-guide
router.get('/my/activities', auth, guideAuth, getMyActivities); // GET /api/activities/my/activities
router.post('/my/activities/add', auth, guideAuth, addActivityToGuide); // POST /api/activities/my/activities/add
router.delete('/my/activities/remove', auth, guideAuth, removeActivityFromGuide); // DELETE /api/activities/my/activities/remove

// ==================== ADMIN ROUTES ====================
// Chỉ admin mới có quyền
router.post('/', auth, adminAuth, createActivity); // POST /api/activities
router.put('/:id', auth, adminAuth, updateActivity); // PUT /api/activities/:id
router.delete('/:id', auth, adminAuth, deleteActivity); // DELETE /api/activities/:id

export default router;