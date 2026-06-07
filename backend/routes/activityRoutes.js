const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

// GET /api/v1/activity/logs
router.get('/logs', activityController.getActivityLogs);

module.exports = router;
