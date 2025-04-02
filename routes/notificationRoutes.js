const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require("../middleware/auth");

// Create a notification
router.post("/send-notification",authMiddleware, notificationController.createNotification);

router.get("/get-notification/:userId", notificationController.getNotifications);

// // Mark notifications as read
// router.put("/:userId/read",authMiddleware, notificationController.markAsRead);








// router.post("/send-notificationAdmin",authMiddleware, notificationController.createNotificationAdmin);

module.exports = router;
