// Routes de gestion des messages
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messagesController');
const authMiddleware = require('../middleware/auth'); // Middleware d'authentification

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Routes pour l'envoi et la réception des messages
router.post('/', messageController.sendMessage);
router.get('/:userId', messageController.getMessages);
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;