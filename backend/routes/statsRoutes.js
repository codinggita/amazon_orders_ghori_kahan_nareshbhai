const express = require('express');
const router  = express.Router();

const {
  // Orders stats
  getTotalOrdersCount,
  getDailyOrderStats,
  getMonthlyOrderStats,
  getYearlyOrderStats,
  // Revenue stats
  getTotalRevenueStats,
  getDailyRevenueStats,
  getMonthlyRevenueStats,
  getYearlyRevenueStats,
  // Count stats
  getProductsCount,
  getCustomersCount,
  getCategoriesCount,
  // Refunds & Cancellations
  getRefundsCount,
  getCancellationsCount,
  // Shipping
  getAverageShippingTime,
  // System / Performance
  getSystemPerformance
} = require('../controllers/statsController');

// ─── Orders Statistics ────────────────────────────────────────────────────────

// GET /api/v1/stats/orders/total
router.get('/orders/total', getTotalOrdersCount);

// GET /api/v1/stats/orders/daily
router.get('/orders/daily', getDailyOrderStats);

// GET /api/v1/stats/orders/monthly
router.get('/orders/monthly', getMonthlyOrderStats);

// GET /api/v1/stats/orders/yearly
router.get('/orders/yearly', getYearlyOrderStats);

// ─── Revenue Statistics ───────────────────────────────────────────────────────

// GET /api/v1/stats/revenue/total
router.get('/revenue/total', getTotalRevenueStats);

// GET /api/v1/stats/revenue/daily
router.get('/revenue/daily', getDailyRevenueStats);

// GET /api/v1/stats/revenue/monthly
router.get('/revenue/monthly', getMonthlyRevenueStats);

// GET /api/v1/stats/revenue/yearly
router.get('/revenue/yearly', getYearlyRevenueStats);

// ─── Count Statistics ─────────────────────────────────────────────────────────

// GET /api/v1/stats/products/count
router.get('/products/count', getProductsCount);

// GET /api/v1/stats/customers/count
router.get('/customers/count', getCustomersCount);

// GET /api/v1/stats/categories/count
router.get('/categories/count', getCategoriesCount);

// ─── Refunds & Cancellations ──────────────────────────────────────────────────

// GET /api/v1/stats/refunds/count
router.get('/refunds/count', getRefundsCount);

// GET /api/v1/stats/cancellations/count
router.get('/cancellations/count', getCancellationsCount);

// ─── Shipping Statistics ──────────────────────────────────────────────────────

// GET /api/v1/stats/shipping/average-time
router.get('/shipping/average-time', getAverageShippingTime);

// ─── System / API Performance ─────────────────────────────────────────────────

// GET /api/v1/stats/system/performance
router.get('/system/performance', getSystemPerformance);

module.exports = router;
