const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// HEAD and OPTIONS route interceptors (must be before CORS to prevent preflight hijacking)
const headOptionsRoutes = require('./routes/headOptionsRoutes');
app.use('/api/v1', headOptionsRoutes);

// Middleware
app.use(cors());
app.use(express.json());

// Custom Request Logger — also feeds /admin/system/logs
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const entry = { method: req.method, path: req.originalUrl, statusCode: res.statusCode, durationMs: duration };
    console.log(`[API] ${entry.method} ${entry.path} - Status: ${entry.statusCode} (${entry.durationMs}ms)`);
    appendLog(entry);
  });
  next();
});

// Routes
const searchRoutes = require('./routes/searchRoutes');
const filterRoutes = require('./routes/filterRoutes');
const orderRoutes = require('./routes/orderRoutes');
const bulkRoutes  = require('./routes/bulkRoutes');
const paginationRoutes = require('./routes/paginationRoutes');
const sortingRoutes = require('./routes/sortingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const statsRoutes = require('./routes/statsRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const authRoutes      = require('./routes/authRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const errorRoutes     = require('./routes/errorRoutes');
const validateRoutes  = require('./routes/validateRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const trendingRoutes   = require('./routes/trendingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const activityRoutes   = require('./routes/activityRoutes');
const dashboardRoutes  = require('./routes/dashboardRoutes');
const systemRoutes     = require('./routes/systemRoutes');
const { performanceMiddleware } = require('./controllers/statsController');
const { appendLog }   = require('./controllers/adminController');

// Performance tracking middleware — must be before all routes
app.use(performanceMiddleware);

app.use('/api/v1/orders/search', searchRoutes);
app.use('/api/v1/orders/filter', filterRoutes);
app.use('/api/v1/orders/sort', sortingRoutes);       // Sorting routes
app.use('/api/v1/orders/bulk',   bulkRoutes);          // Bulk operations routes — MUST be before orderRoutes
app.use('/api/v1/orders', paginationRoutes);          // Pagination routes
app.use('/api/v1/orders', orderRoutes);               // Core CRUD routes
app.use('/api/v1/analytics', analyticsRoutes);        // Analytics routes
app.use('/api/v1/stats', statsRoutes);                // Statistics routes
app.use('/api/v1/shipping', shippingRoutes);           // Shipping & Delivery routes
app.use('/api/v1/auth',     authRoutes);               // Authentication routes
app.use('/api/v1/admin',    adminRoutes);              // Admin routes
app.use('/api/v1/errors',   errorRoutes);              // Error simulation routes
app.use('/api/v1/validate', validateRoutes);           // Validation routes
app.use('/api/v1/recommendations', recommendationRoutes); // Recommendations
app.use('/api/v1/trending', trendingRoutes);           // Trending products & categories
app.use('/api/v1/notifications', notificationRoutes);   // Notifications
app.use('/api/v1/activity', activityRoutes);           // Activity logs
app.use('/api/v1/dashboard', dashboardRoutes);          // Dashboard metrics
app.use('/api/v1/system', systemRoutes);               // System info & health checks

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Basic Route
app.get('/', (req, res) => {
  res.send('Amazon Orders Backend is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
