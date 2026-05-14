const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  replaceOrder,
  updateOrderFields,
  deleteOrder,
  checkOrderExists,
  getOrderSummary,
  getOrderItems,
  getOrderHistory,
  archiveOrder,
  restoreOrder,
  cancelOrder,
  duplicateOrder,
  generateInvoice
} = require('../controllers/orderController');

// Basic CRUD
router.route('/')
  .get(getAllOrders)
  .post(createOrder);

router.route('/:orderId')
  .get(getOrderById)
  .put(replaceOrder)
  .patch(updateOrderFields)
  .delete(deleteOrder);

// Specialized Routes
router.get('/:orderId/exists', checkOrderExists);
router.get('/:orderId/summary', getOrderSummary);
router.get('/:orderId/items', getOrderItems);
router.get('/:orderId/history', getOrderHistory);
router.get('/:orderId/invoice', generateInvoice);

router.patch('/:orderId/archive', archiveOrder);
router.patch('/:orderId/restore', restoreOrder);

router.post('/:orderId/cancel', cancelOrder);
router.post('/:orderId/duplicate', duplicateOrder);

module.exports = router;
