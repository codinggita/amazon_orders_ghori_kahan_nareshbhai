const express = require('express');
const router = express.Router();

const {
  // Revenue
  getTotalRevenue,
  getMonthlyRevenue,
  getYearlyRevenue,
  // Orders
  getAverageOrderValue,
  getOrdersCount,
  getCancelledOrderAnalytics,
  getRefundedOrderAnalytics,
  // Customers
  getTopCustomers,
  // Products
  getTopSellingProducts,
  getLowSellingProducts,
  // Categories
  getTopCategories,
  // Payments
  getPaymentDistribution,
  // Locations
  getTopCities,
  // Returns & Discounts
  getReturnRate,
  getDiscountUsage
} = require('../controllers/analyticsController');

// ─── Revenue Routes ───────────────────────────────────────────────────────────
// GET /api/v1/analytics/revenue/total
router.get('/revenue/total', getTotalRevenue);

// GET /api/v1/analytics/revenue/monthly
router.get('/revenue/monthly', getMonthlyRevenue);

// GET /api/v1/analytics/revenue/yearly
router.get('/revenue/yearly', getYearlyRevenue);

// ─── Order Analytics Routes ───────────────────────────────────────────────────
// GET /api/v1/analytics/orders/average-value
router.get('/orders/average-value', getAverageOrderValue);

// GET /api/v1/analytics/orders/count
router.get('/orders/count', getOrdersCount);

// GET /api/v1/analytics/orders/cancelled
router.get('/orders/cancelled', getCancelledOrderAnalytics);

// GET /api/v1/analytics/orders/refunded
router.get('/orders/refunded', getRefundedOrderAnalytics);

// ─── Customer Analytics Routes ────────────────────────────────────────────────
// GET /api/v1/analytics/customers/top
// Optional query: ?limit=10
router.get('/customers/top', getTopCustomers);

// ─── Product Analytics Routes ─────────────────────────────────────────────────
// GET /api/v1/analytics/products/top-selling
// Optional query: ?limit=10
router.get('/products/top-selling', getTopSellingProducts);

// GET /api/v1/analytics/products/low-selling
// Optional query: ?limit=10
router.get('/products/low-selling', getLowSellingProducts);

// ─── Category Analytics Routes ────────────────────────────────────────────────
// GET /api/v1/analytics/categories/top
// Optional query: ?limit=10
router.get('/categories/top', getTopCategories);

// ─── Payment Analytics Routes ─────────────────────────────────────────────────
// GET /api/v1/analytics/payments/distribution
router.get('/payments/distribution', getPaymentDistribution);

// ─── Location Analytics Routes ────────────────────────────────────────────────
// GET /api/v1/analytics/locations/top-cities
// Optional query: ?limit=10
router.get('/locations/top-cities', getTopCities);

// ─── Returns & Discount Analytics Routes ─────────────────────────────────────
// GET /api/v1/analytics/returns/rate
router.get('/returns/rate', getReturnRate);

// GET /api/v1/analytics/discounts/usage
router.get('/discounts/usage', getDiscountUsage);

module.exports = router;
