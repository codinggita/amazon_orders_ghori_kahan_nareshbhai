const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/v1/dashboard/overview
router.get('/overview', dashboardController.getOverview);

// GET /api/v1/dashboard/revenue
router.get('/revenue', dashboardController.getRevenueDashboard);

// GET /api/v1/dashboard/orders
router.get('/orders', dashboardController.getOrdersDashboard);

// GET /api/v1/dashboard/customers
router.get('/customers', dashboardController.getCustomersDashboard);

// GET /api/v1/dashboard/products
router.get('/products', dashboardController.getProductsDashboard);

module.exports = router;
