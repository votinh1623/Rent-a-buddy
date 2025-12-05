// backend/src/routes/auth.route.js
import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import {
  login,
  logout,
  refreshToken,
  sendOtp,
  verifyOtpAndSignup
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', auth, logout);
router.post('/refresh-token', refreshToken);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndSignup);

export default router;