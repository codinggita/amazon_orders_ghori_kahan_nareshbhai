const express = require('express');
const router = express.Router();

const {
  getPagedOrders,
  getInfiniteOrders,
  getRecentOrders,
  getCancelledOrders,
  getRefundedOrders,
  getCustomerOrders,
  getProductOrders
} = require('../controllers/paginationController');

const { searchPaged } = require('../controllers/searchController');

// GET /api/v1/orders/paged?page=1&limit=50
router.get('/paged', getPagedOrders);

// GET /api/v1/orders/infinite?page=1
router.get('/infinite', getInfiniteOrders);

// GET /api/v1/orders/recent?page=1&limit=5
router.get('/recent', getRecentOrders);

// GET /api/v1/orders/cancelled?page=1&limit=10
router.get('/cancelled', getCancelledOrders);

// GET /api/v1/orders/refunded?page=1&limit=10
router.get('/refunded', getRefundedOrders);

// GET /api/v1/orders/customer/:customerId?page=1&limit=10
router.get('/customer/:customerId', getCustomerOrders);

// GET /api/v1/orders/product/:productId?page=1&limit=10
router.get('/product/:productId', getProductOrders);

// GET /api/v1/orders/search/paged?q=phone&page=1&limit=20
router.get('/search/paged', searchPaged);

module.exports = router;
