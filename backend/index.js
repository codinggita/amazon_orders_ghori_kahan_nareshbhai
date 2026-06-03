const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Custom Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Routes
const searchRoutes = require('./routes/searchRoutes');
const filterRoutes = require('./routes/filterRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paginationRoutes = require('./routes/paginationRoutes');
const sortingRoutes = require('./routes/sortingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

app.use('/api/v1/orders/search', searchRoutes);
app.use('/api/v1/orders/filter', filterRoutes);
app.use('/api/v1/orders/sort', sortingRoutes);       // Sorting routes
app.use('/api/v1/orders', paginationRoutes);          // Pagination routes
app.use('/api/v1/orders', orderRoutes);               // Core CRUD routes
app.use('/api/v1/analytics', analyticsRoutes);        // Analytics routes

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
