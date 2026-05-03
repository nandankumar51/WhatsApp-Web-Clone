const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// Create or Get Chat
router.post('/', authMiddleware, chatController.createOrGetChat);
router.post('/group', authMiddleware, chatController.createGroupChat);

// Get all chats for a user
router.get('/user/:userId', chatController.getUserChats);

// Get chat by ID
router.get('/:chatId', chatController.getChatById);

module.exports = router;
