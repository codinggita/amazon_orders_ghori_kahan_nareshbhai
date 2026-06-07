const express = require('express');
const router = express.Router();
const errorController = require('../controllers/errorController');

router.get('/not-found', errorController.simulateNotFound);
router.get('/server-error', errorController.simulateServerError);
router.get('/database', errorController.simulateDatabaseError);
router.get('/validation', errorController.simulateValidationFailure);
router.get('/rate-limit', errorController.simulateRateLimit);
router.get('/token-expired', errorController.simulateTokenExpired);
router.get('/payment-failed', errorController.simulatePaymentFailed);
router.get('/shipping-failed', errorController.simulateShippingFailed);
router.get('/upload-error', errorController.simulateUploadError);
router.get('/cache-error', errorController.simulateCacheError);

module.exports = router;
