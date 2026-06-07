const express = require('express');
const router = express.Router();
const validateController = require('../controllers/validateController');

// POST /api/v1/validate/order
router.post('/order', validateController.validateOrder);

// PATCH /api/v1/validate/order/:id
router.patch('/order/:id', validateController.validateOrderUpdate);

// POST /api/v1/validate/payment
router.post('/payment', validateController.validatePayment);

// POST /api/v1/validate/address
router.post('/address', validateController.validateAddress);

// POST /api/v1/validate/auth/register
router.post('/auth/register', validateController.validateRegister);

// POST /api/v1/validate/auth/login
router.post('/auth/login', validateController.validateLogin);

// POST /api/v1/validate/product
router.post('/product', validateController.validateProduct);

// POST /api/v1/validate/refund
router.post('/refund', validateController.validateRefund);

// POST /api/v1/validate/coupon
router.post('/coupon', validateController.validateCoupon);

// POST /api/v1/validate/upload
router.post('/upload', validateController.validateUpload);

module.exports = router;
