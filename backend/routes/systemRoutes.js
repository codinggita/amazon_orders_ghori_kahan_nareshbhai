const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

// GET /api/v1/system/version
router.get('/version', systemController.getVersion);

// GET /api/v1/system/config
router.get('/config', systemController.getConfig);

// GET /api/v1/system/uptime
router.get('/uptime', systemController.getUptime);

// GET /api/v1/system/ping
router.get('/ping', systemController.ping);

// GET /api/v1/system/status/database
router.get('/status/database', systemController.getDatabaseStatus);

// GET /api/v1/system/status/cache
router.get('/status/cache', systemController.getCacheStatus);

// GET /api/v1/system/status/storage
router.get('/status/storage', systemController.getStorageStatus);

module.exports = router;
