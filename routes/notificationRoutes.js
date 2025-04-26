// Routes de gestion des notifications
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require("../middleware/auth");

// Créer une notification
router.post("/send-notification", authMiddleware, notificationController.createNotification);

// Obtenir les notifications d'un utilisateur
router.get("/get-notification/:userId", notificationController.getNotifications);

// Routes commentées pour référence future
// router.put("/:userId/read", authMiddleware, notificationController.markAsRead);
// router.post("/send-notificationAdmin", authMiddleware, notificationController.createNotificationAdmin);

module.exports = router;
