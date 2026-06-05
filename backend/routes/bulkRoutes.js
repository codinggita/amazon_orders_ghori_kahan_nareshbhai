const express = require('express');
const router  = express.Router();

const {
  bulkCreateOrders,
  bulkUpdateOrders,
  bulkDeleteOrders,
  bulkUpdateStatus,
  bulkArchiveOrders,
  bulkRestoreOrders,
  bulkApplyDiscount,
  bulkUpdatePaymentStatus,
  bulkUpdateShippingStatus,
  cleanupCancelledOrders
} = require('../controllers/bulkController');

// ─── Bulk Create ──────────────────────────────────────────────────────────────
// POST /api/v1/orders/bulk/create
// Body: { orders: [{OrderID, CustomerName, ProductName, TotalAmount, ...}, ...] }
router.post('/create', bulkCreateOrders);

// ─── Bulk Update ──────────────────────────────────────────────────────────────
// PATCH /api/v1/orders/bulk/update
// Body: { orderIds: [...], updates: { field: value } }
router.patch('/update', bulkUpdateOrders);

// ─── Bulk Delete ──────────────────────────────────────────────────────────────
// DELETE /api/v1/orders/bulk/delete
// Body: { orderIds: [...] }
router.delete('/delete', bulkDeleteOrders);

// ─── Bulk Status Update ───────────────────────────────────────────────────────
// PATCH /api/v1/orders/bulk/status
// Body: { orderIds: [...], status: "Shipped" }
router.patch('/status', bulkUpdateStatus);

// ─── Bulk Archive ─────────────────────────────────────────────────────────────
// PATCH /api/v1/orders/bulk/archive
// Body: { orderIds: [...] }
router.patch('/archive', bulkArchiveOrders);

// ─── Bulk Restore ─────────────────────────────────────────────────────────────
// PATCH /api/v1/orders/bulk/restore
// Body: { orderIds: [...] }
router.patch('/restore', bulkRestoreOrders);

// ─── Bulk Apply Discount ──────────────────────────────────────────────────────
// POST /api/v1/orders/bulk/apply-discount
// Body: { orderIds: [...], discountType: "percentage"|"flat", discountValue: 10 }
router.post('/apply-discount', bulkApplyDiscount);

// ─── Bulk Payment Status Update ───────────────────────────────────────────────
// PATCH /api/v1/orders/bulk/payment-status
// Body: { orderIds: [...], paymentMethod: "Credit Card" }
router.patch('/payment-status', bulkUpdatePaymentStatus);

// ─── Bulk Shipping Status Update ──────────────────────────────────────────────
// PATCH /api/v1/orders/bulk/shipping-status
// Body: { orderIds: [...], shippingStatus: "Shipped" }
router.patch('/shipping-status', bulkUpdateShippingStatus);

// ─── Cleanup Cancelled Orders ─────────────────────────────────────────────────
// DELETE /api/v1/orders/bulk/cleanup-cancelled?confirm=true
router.delete('/cleanup-cancelled', cleanupCancelledOrders);

module.exports = router;
