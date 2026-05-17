const express = require('express');
const router = express.Router();
const {
  searchAll,
  searchByCustomer,
  searchByProduct,
  searchByCategory,
  searchByBrand,
  searchByStatus,
  searchByPayment,
  searchByLocation,
  searchByDate,
  searchByTracking,
  searchFuzzy,
  searchAutocomplete,
  searchHighlight,
  getRecentSearches,
  getPopularSearches
} = require('../controllers/searchController');

// Routes without parameters (must come before /:param if any)
router.get('/recent', getRecentSearches);
router.get('/popular', getPopularSearches);

// Specific search routes
router.get('/customer', searchByCustomer);
router.get('/product', searchByProduct);
router.get('/category', searchByCategory);
router.get('/brand', searchByBrand);
router.get('/status', searchByStatus);
router.get('/payment', searchByPayment);
router.get('/location', searchByLocation);
router.get('/date', searchByDate);
router.get('/tracking', searchByTracking);
router.get('/fuzzy', searchFuzzy);
router.get('/autocomplete', searchAutocomplete);
router.get('/highlight', searchHighlight);

// General search route
router.get('/', searchAll);

module.exports = router;
