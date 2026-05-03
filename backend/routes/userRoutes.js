const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Register and Login (No auth required)
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/me', authMiddleware, userController.getCurrentUser);
router.put('/me/presence', authMiddleware, userController.updatePresence);
router.get('/search', userController.searchUsers);

// Get all users (No auth required for now, but you can add it)
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user profile (Auth required)
router.put('/:id', authMiddleware, userController.updateUserProfile);

module.exports = router;
