const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Create a notification
router.post("/send-notification", notificationController.createNotification);

// Get notifications for a specific user
router.get("/:userId", notificationController.getNotifications);

// Mark notifications as read
router.put("/:userId/read", notificationController.markAsRead);








router.post("/send-notificationAdmin", notificationController.createNotificationAdmin);

module.exports = router;
