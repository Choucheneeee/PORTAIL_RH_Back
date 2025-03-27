const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messagesController');
const authMiddleware = require('../middleware/auth'); // Your authentication middleware

router.use(authMiddleware);

router.post('/', messageController.sendMessage);

router.get('/:userId', messageController.getMessages);



router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;