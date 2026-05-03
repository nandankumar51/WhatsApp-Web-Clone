const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// Send Message
router.post('/', authMiddleware, messageController.sendMessage);

// Get Messages for a Chat
router.get('/chat/:chatId', messageController.getMessages);

// Clear Messages for a Chat
router.delete('/chat/:chatId', authMiddleware, messageController.clearChatMessages);

// Mark Message as Read
router.put('/:messageId/read', messageController.markMessageAsRead);

module.exports = router;
