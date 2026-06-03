const express = require('express');
const router = express.Router();

const {
  sortByQuery,
  sortHighestValue,
  sortLowestValue,
  sortLatest,
  sortOldest,
  sortMostItems,
  sortLeastItems,
  sortByDiscount
} = require('../controllers/sortingController');

// ─── Query-param based sorting ────────────────────────────────────────────────
// Handles all ?sort= variants from the table:
//   GET /api/v1/orders/sort?sort=amount      → sort by amount asc
//   GET /api/v1/orders/sort?sort=-amount     → sort by amount desc (highest first)
//   GET /api/v1/orders/sort?sort=date        → oldest first
//   GET /api/v1/orders/sort?sort=-date       → newest first
//   GET /api/v1/orders/sort?sort=status      → sort by status
//   GET /api/v1/orders/sort?sort=customer    → sort by customer name
//   GET /api/v1/orders/sort?sort=city        → sort by city
//   GET /api/v1/orders/sort?sort=payment     → sort by payment method
router.get('/', sortByQuery);

// ─── Dedicated sort endpoints ─────────────────────────────────────────────────
// GET /api/v1/orders/sort/highest-value
router.get('/highest-value', sortHighestValue);

// GET /api/v1/orders/sort/lowest-value
router.get('/lowest-value', sortLowestValue);

// GET /api/v1/orders/sort/latest
router.get('/latest', sortLatest);

// GET /api/v1/orders/sort/oldest
router.get('/oldest', sortOldest);

// GET /api/v1/orders/sort/most-items
router.get('/most-items', sortMostItems);

// GET /api/v1/orders/sort/least-items
router.get('/least-items', sortLeastItems);

// GET /api/v1/orders/sort/discount
router.get('/discount', sortByDiscount);

module.exports = router;
