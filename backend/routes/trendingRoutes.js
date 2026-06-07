const express = require('express');
const router = express.Router();
const trendingController = require('../controllers/trendingController');

// GET /api/v1/trending/products
router.get('/products', trendingController.getTrendingProducts);

// GET /api/v1/trending/categories
router.get('/categories', trendingController.getTrendingCategories);

module.exports = router;
