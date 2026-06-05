const express = require('express');
const router  = express.Router();

const {
  trackShipment,
  updateShippingStatus,
  getPendingShipments,
  getDeliveredShipments,
  getReturnedShipments,
  createShippingLabel,
  estimateDelivery,
  getCarriers,
  changeShippingAddress,
  rescheduleDelivery
} = require('../controllers/shippingController');

// ─── Tracking ─────────────────────────────────────────────────────────────────
// GET /api/v1/shipping/tracking/:orderId
router.get('/tracking/:orderId', trackShipment);

// ─── Status Update ────────────────────────────────────────────────────────────
// PATCH /api/v1/shipping/update-status/:orderId
router.patch('/update-status/:orderId', updateShippingStatus);

// ─── Shipment Lists ───────────────────────────────────────────────────────────
// GET /api/v1/shipping/pending
router.get('/pending', getPendingShipments);

// GET /api/v1/shipping/delivered
router.get('/delivered', getDeliveredShipments);

// GET /api/v1/shipping/returned
router.get('/returned', getReturnedShipments);

// ─── Label & Estimate ─────────────────────────────────────────────────────────
// POST /api/v1/shipping/create-label
router.post('/create-label', createShippingLabel);

// GET /api/v1/shipping/estimate/:orderId
router.get('/estimate/:orderId', estimateDelivery);

// ─── Carriers ─────────────────────────────────────────────────────────────────
// GET /api/v1/shipping/carriers
router.get('/carriers', getCarriers);

// ─── Address & Reschedule ─────────────────────────────────────────────────────
// PATCH /api/v1/shipping/change-address/:orderId
router.patch('/change-address/:orderId', changeShippingAddress);

// POST /api/v1/shipping/reschedule/:orderId
router.post('/reschedule/:orderId', rescheduleDelivery);

module.exports = router;
