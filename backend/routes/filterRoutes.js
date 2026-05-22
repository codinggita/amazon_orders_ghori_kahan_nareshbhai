const express = require('express');
const router = express.Router();
const {
  filterByStatus,
  filterByPayment,
  filterByCategory,
  filterByBrand,
  filterByPrice,
  filterByDate,
  filterByCountry,
  filterByState,
  filterByCity,
  filterHighValue,
  filterDiscounted,
  filterCancelled,
  filterRefunded,
  filterShipped,
  filterDelivered
} = require('../controllers/filterController');

// Routes without parameters (must come before routes that might conflict, though here we use specific paths)
router.get('/high-value', filterHighValue);
router.get('/discounted', filterDiscounted);
router.get('/cancelled', filterCancelled);
router.get('/refunded', filterRefunded);
router.get('/shipped', filterShipped);
router.get('/delivered', filterDelivered);

// Routes with query parameters
router.get('/status', filterByStatus);
router.get('/payment', filterByPayment);
router.get('/category', filterByCategory);
router.get('/brand', filterByBrand);
router.get('/price', filterByPrice);
router.get('/date', filterByDate);
router.get('/country', filterByCountry);
router.get('/state', filterByState);
router.get('/city', filterByCity);

module.exports = router;
