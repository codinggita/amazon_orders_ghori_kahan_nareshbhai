const express = require('express');
const router  = express.Router();

const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  deleteProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  sendOtp,
  verifyOtp,
  getSessions,
  deleteSession,
  refreshToken
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// ─── Public Routes (no token needed) ─────────────────────────────────────────

// POST /api/v1/auth/register
router.post('/register', register);

// POST /api/v1/auth/login
router.post('/login', login);

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/v1/auth/reset-password
router.post('/reset-password', resetPassword);

// POST /api/v1/auth/verify-email
router.post('/verify-email', verifyEmail);

// POST /api/v1/auth/send-otp
router.post('/send-otp', sendOtp);

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', refreshToken);

// ─── Protected Routes (Bearer token required) ─────────────────────────────────

// POST /api/v1/auth/logout
router.post('/logout', protect, logout);

// GET  /api/v1/auth/profile
router.get('/profile', protect, getProfile);

// PATCH /api/v1/auth/profile
router.patch('/profile', protect, updateProfile);

// DELETE /api/v1/auth/profile
router.delete('/profile', protect, deleteProfile);

// POST /api/v1/auth/change-password
router.post('/change-password', protect, changePassword);

// GET /api/v1/auth/sessions
router.get('/sessions', protect, getSessions);

// DELETE /api/v1/auth/sessions/:id
router.delete('/sessions/:id', protect, deleteSession);

module.exports = router;
