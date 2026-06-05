const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const User    = require('../models/User');

// ─── Config ───────────────────────────────────────────────────────────────────
const JWT_SECRET          = process.env.JWT_SECRET          || 'amazon_orders_jwt_secret_key_2026';
const JWT_EXPIRES_IN      = process.env.JWT_EXPIRES_IN      || '1h';
const JWT_REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET  || 'amazon_orders_refresh_secret_2026';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const signAccessToken  = (payload) => jwt.sign(payload, JWT_SECRET,         { expiresIn: JWT_EXPIRES_IN });
const signRefreshToken = (payload) => jwt.sign(payload, JWT_REFRESH_SECRET,  { expiresIn: JWT_REFRESH_EXPIRES });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

const buildSessionId = () => crypto.randomBytes(16).toString('hex');

const safeUser = (user) => ({
  id:              user._id,
  name:            user.name,
  email:           user.email,
  role:            user.role,
  isEmailVerified: user.isEmailVerified,
  isActive:        user.isActive,
  createdAt:       user.createdAt,
  updatedAt:       user.updatedAt
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/register
// Register a new user
// ══════════════════════════════════════════════════════════════════════════════
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, email and password are required'
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user',
      emailVerifyToken
    });

    const accessToken  = signAccessToken({ id: user._id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    // Persist refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        user:         safeUser(user),
        accessToken,
        refreshToken,
        emailVerifyToken, // In production: send via email, not in response
        expiresIn:    JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/login
// Login an existing user
// ══════════════════════════════════════════════════════════════════════════════
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken  = signAccessToken({ id: user._id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    // Create new session
    const sessionId = buildSessionId();
    const session = {
      sessionId,
      device:     req.headers['user-agent']?.substring(0, 80) || 'Unknown',
      ip:         req.ip || req.socket.remoteAddress || 'Unknown',
      userAgent:  req.headers['user-agent'] || '',
      createdAt:  new Date(),
      lastActive: new Date()
    };

    // Keep last 5 sessions only
    user.sessions = [...(user.sessions || []).slice(-4), session];
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user:         safeUser(user),
        accessToken,
        refreshToken,
        sessionId,
        expiresIn:    JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/logout
// Logout authenticated user (clears refresh token + current session)
// Requires: Authorization: Bearer <token>
// Body (optional): { sessionId }
// ══════════════════════════════════════════════════════════════════════════════
exports.logout = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const user = await User.findById(req.user.id).select('+refreshToken');

    if (user) {
      if (sessionId) {
        user.sessions = user.sessions.filter(s => s.sessionId !== sessionId);
      } else {
        user.sessions = []; // logout from all sessions
      }
      user.refreshToken = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(200).json({
      success: true,
      message: sessionId ? 'Logged out from this session successfully' : 'Logged out from all sessions successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/auth/profile
// Fetch authenticated user's profile
// Requires: Authorization: Bearer <token>
// ══════════════════════════════════════════════════════════════════════════════
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: safeUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/auth/profile
// Update authenticated user's profile (name only; email change needs verify)
// Requires: Authorization: Bearer <token>
// ══════════════════════════════════════════════════════════════════════════════
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Provide at least name to update' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: safeUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/auth/profile
// Delete (deactivate) the authenticated user's account
// Requires: Authorization: Bearer <token>
// ══════════════════════════════════════════════════════════════════════════════
exports.deleteProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isActive: false, sessions: [], refreshToken: undefined },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({
      success: true,
      message: 'Account deleted (deactivated) successfully. Contact support to restore.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/forgot-password
// Request a password reset token
// Body: { email }
// ══════════════════════════════════════════════════════════════════════════════
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond the same to avoid email enumeration
    const genericMsg = 'If that email exists, a reset link has been sent.';

    if (!user) {
      return res.status(200).json({ success: true, message: genericMsg });
    }

    const resetToken      = crypto.randomBytes(32).toString('hex');
    user.resetToken       = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save({ validateBeforeSave: false });

    // In production: send resetToken via email as a link
    // e.g. https://yourfrontend.com/reset-password?token=<resetToken>

    res.status(200).json({
      success: true,
      message: genericMsg,
      // Only expose token in dev — remove in production
      debug: { resetToken, expiresIn: '15 minutes' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/reset-password
// Reset account password using the reset token
// Body: { resetToken, newPassword }
// ══════════════════════════════════════════════════════════════════════════════
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'resetToken and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'newPassword must be at least 6 characters' });
    }

    const user = await User.findOne({
      resetToken,
      resetTokenExpiry: { $gt: new Date() }
    }).select('+resetToken +resetTokenExpiry');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password         = newPassword; // will be hashed by pre-save hook
    user.resetToken       = undefined;
    user.resetTokenExpiry = undefined;
    user.sessions         = [];          // force re-login everywhere
    user.refreshToken     = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/change-password
// Change current password (requires old password)
// Requires: Authorization: Bearer <token>
// Body: { currentPassword, newPassword }
// ══════════════════════════════════════════════════════════════════════════════
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'newPassword must be at least 6 characters' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password     = newPassword; // hashed by pre-save hook
    user.sessions     = [];          // force re-login from all devices
    user.refreshToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/verify-email
// Verify email using the token sent during registration
// Body: { token }
// ══════════════════════════════════════════════════════════════════════════════
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'token is required' });
    }

    const user = await User.findOne({ emailVerifyToken: token }).select('+emailVerifyToken');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ success: true, message: 'Email is already verified' });
    }

    user.isEmailVerified  = true;
    user.emailVerifyToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: safeUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/send-otp
// Send a 6-digit OTP to the user's email
// Body: { email }
// ══════════════════════════════════════════════════════════════════════════════
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'email is required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    const otp       = generateOTP();
    user.otp        = otp;
    user.otpExpiry  = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false });

    // In production: send OTP via email/SMS service (e.g. SendGrid, Twilio)
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully. Valid for 10 minutes.',
      // Only expose OTP in dev — remove in production
      debug: { otp, expiresIn: '10 minutes' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/verify-otp
// Verify the OTP entered by the user
// Body: { email, otp }
// ══════════════════════════════════════════════════════════════════════════════
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'email and otp are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > user.otpExpiry) {
      user.otp = undefined; user.otpExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp !== otp.toString()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP' });
    }

    // Clear OTP after successful verify
    user.otp = undefined; user.otpExpiry = undefined;
    user.isEmailVerified = true; // mark email as verified on OTP success
    await user.save({ validateBeforeSave: false });

    const accessToken = signAccessToken({ id: user._id, email: user.email, role: user.role });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user:        safeUser(user),
        accessToken,
        expiresIn:   JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/auth/sessions
// Fetch all active sessions for the authenticated user
// Requires: Authorization: Bearer <token>
// ══════════════════════════════════════════════════════════════════════════════
exports.getSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('sessions');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({
      success: true,
      message: 'Active sessions fetched successfully',
      count: user.sessions.length,
      data: user.sessions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/auth/sessions/:id
// Remove a specific session by sessionId
// Requires: Authorization: Bearer <token>
// ══════════════════════════════════════════════════════════════════════════════
exports.deleteSession = async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    const user = await User.findById(req.user.id).select('sessions');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const before = user.sessions.length;
    user.sessions = user.sessions.filter(s => s.sessionId !== sessionId);

    if (user.sessions.length === before) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Session removed successfully',
      remainingSessions: user.sessions.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/refresh-token
// Refresh the access token using a valid refresh token
// Body: { refreshToken }
// ══════════════════════════════════════════════════════════════════════════════
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'refreshToken is required' });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === 'TokenExpiredError'
          ? 'Refresh token expired. Please login again.'
          : 'Invalid refresh token.'
      });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token is invalid or has been revoked.' });
    }

    const newAccessToken  = signAccessToken({ id: user._id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user._id });

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      data: {
        accessToken:  newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn:    JWT_EXPIRES_IN
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
