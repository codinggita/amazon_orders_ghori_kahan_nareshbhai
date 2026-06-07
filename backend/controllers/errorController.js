exports.simulateNotFound = (req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
};

exports.simulateServerError = (req, res) => {
  res.status(500).json({ success: false, message: 'Internal server error occurred' });
};

exports.simulateDatabaseError = (req, res) => {
  res.status(500).json({ success: false, message: 'Database connection failed or query error' });
};

exports.simulateValidationFailure = (req, res) => {
  res.status(400).json({ 
    success: false, 
    message: 'Validation failed', 
    errors: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'password', message: 'Password must be at least 8 characters long' }
    ] 
  });
};

exports.simulateRateLimit = (req, res) => {
  res.status(429).json({ success: false, message: 'Too many requests, please try again later' });
};

exports.simulateTokenExpired = (req, res) => {
  res.status(401).json({ success: false, message: 'Authentication token has expired' });
};

exports.simulatePaymentFailed = (req, res) => {
  res.status(402).json({ success: false, message: 'Payment processing failed' });
};

exports.simulateShippingFailed = (req, res) => {
  res.status(422).json({ success: false, message: 'Shipping address is invalid or unserviceable' });
};

exports.simulateUploadError = (req, res) => {
  res.status(413).json({ success: false, message: 'File size exceeds the allowed limit' });
};

exports.simulateCacheError = (req, res) => {
  res.status(503).json({ success: false, message: 'Cache server is temporarily unavailable' });
};
