const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const sessionSchema = new mongoose.Schema({
  sessionId:   { type: String, required: true },
  device:      { type: String, default: 'Unknown Device' },
  ip:          { type: String, default: '' },
  userAgent:   { type: String, default: '' },
  createdAt:   { type: Date,   default: Date.now },
  lastActive:  { type: Date,   default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name:              { type: String, required: true, trim: true },
  email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:          { type: String, minlength: 6, select: false },    // optional — Google OAuth users have no password
  googleId:          { type: String, select: false },                   // Google OAuth subject ID
  authProvider:      { type: String, enum: ['local', 'google'], default: 'local' },
  role:              { type: String, enum: ['user', 'admin'], default: 'user' },
  isEmailVerified:   { type: Boolean, default: false },
  emailVerifyToken:  { type: String, select: false },
  otp:               { type: String, select: false },
  otpExpiry:         { type: Date,   select: false },
  resetToken:        { type: String, select: false },
  resetTokenExpiry:  { type: Date,   select: false },
  refreshToken:      { type: String, select: false },
  sessions:          { type: [sessionSchema], default: [] },
  isActive:          { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before save (Mongoose 9: no next callback — just return async)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare plain password with hash
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
