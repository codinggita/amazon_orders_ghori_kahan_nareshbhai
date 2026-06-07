const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// GET /api/v1/recommendations/products/:customerId
router.get('/products/:customerId', recommendationController.getRecommendationsForCustomer);

// GET /api/v1/recommendations/orders/:orderId
router.get('/orders/:orderId', recommendationController.getRecommendationsForOrder);

module.exports = router;
