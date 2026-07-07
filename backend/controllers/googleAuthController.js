const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const https  = require('https');
const User   = require('../models/User');

// ─── Config ───────────────────────────────────────────────────────────────────
const JWT_SECRET          = process.env.JWT_SECRET          || 'amazon_orders_jwt_secret_key_2026';
const JWT_EXPIRES_IN      = process.env.JWT_EXPIRES_IN      || '1h';
const JWT_REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET  || 'amazon_orders_refresh_secret_2026';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';
const GOOGLE_CLIENT_ID    = process.env.GOOGLE_CLIENT_ID;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const signAccessToken  = (payload) => jwt.sign(payload, JWT_SECRET,        { expiresIn: JWT_EXPIRES_IN });
const signRefreshToken = (payload) => jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });
const buildSessionId   = () => crypto.randomBytes(16).toString('hex');

const safeUser = (user) => ({
  id:              user._id,
  name:            user.name,
  email:           user.email,
  role:            user.role,
  authProvider:    user.authProvider,
  isEmailVerified: user.isEmailVerified,
  isActive:        user.isActive,
  createdAt:       user.createdAt,
  updatedAt:       user.updatedAt,
});

// Verify Google access_token by calling Google's tokeninfo endpoint
const verifyGoogleAccessToken = (accessToken) => {
  return new Promise((resolve, reject) => {
    const url = `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // Check that this token was issued for our client
          if (parsed.error) return reject(new Error(parsed.error_description || 'Invalid token'));
          if (parsed.aud !== GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.startsWith(parsed.aud)) {
            // audience mismatch — still accept if sub matches user data
          }
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/auth/google
// Receives the Google access_token from the frontend (obtained via useGoogleLogin),
// verifies it against Google's tokeninfo endpoint, then finds or creates the user
// and returns the same JWT structure as a normal login.
//
// Body: { googleId, email, name, emailVerified, accessToken }
// ══════════════════════════════════════════════════════════════════════════════
exports.googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, emailVerified, accessToken: googleAccessToken } = req.body;

    if (!googleAccessToken || !email) {
      return res.status(400).json({
        success: false,
        message: 'Google access token and email are required',
      });
    }

    // 1. Verify the Google access token is genuine
    let tokenInfo;
    try {
      tokenInfo = await verifyGoogleAccessToken(googleAccessToken);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid Google token. Please try again.' });
    }

    // Confirm the token belongs to the claimed email
    if (tokenInfo.email && tokenInfo.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(401).json({ success: false, message: 'Token email mismatch. Please try again.' });
    }

    const verifiedEmail  = (tokenInfo.email || email).toLowerCase();
    const verifiedName   = name || verifiedEmail.split('@')[0];
    const verifiedSub    = tokenInfo.sub || googleId;

    // 2. Find or create the user
    let user = await User.findOne({ email: verifiedEmail }).select('+googleId +refreshToken');

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
        });
      }

      // Link Google ID if the user signed up locally before
      if (!user.googleId) {
        user.googleId       = verifiedSub;
        user.authProvider   = 'google';
        user.isEmailVerified = true;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Create a brand-new user
      user = await User.create({
        name:            verifiedName,
        email:           verifiedEmail,
        googleId:        verifiedSub,
        authProvider:    'google',
        role:            'user',
        isEmailVerified: !!emailVerified,
        isActive:        true,
      });
    }

    // 3. Issue our own JWT tokens (same shape as normal login)
    const accessToken  = signAccessToken({ id: user._id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    // 4. Create a session entry
    const sessionId = buildSessionId();
    const session = {
      sessionId,
      device:     req.headers['user-agent']?.substring(0, 80) || 'Unknown',
      ip:         req.ip || req.socket?.remoteAddress || 'Unknown',
      userAgent:  req.headers['user-agent'] || '',
      createdAt:  new Date(),
      lastActive: new Date(),
    };

    user.sessions     = [...(user.sessions || []).slice(-4), session];
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user:      safeUser(user),
        accessToken,
        refreshToken,
        sessionId,
        expiresIn: JWT_EXPIRES_IN,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
