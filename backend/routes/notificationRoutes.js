const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// GET /api/v1/notifications
router.get('/', notificationController.getNotifications);

// PATCH /api/v1/notifications/read/:id
router.patch('/read/:id', notificationController.markAsRead);

// DELETE /api/v1/notifications/:id
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
