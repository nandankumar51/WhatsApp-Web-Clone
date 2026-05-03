const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const localDb = require('../services/localDb');

const isMongoConnected = () => mongoose.connection.readyState === 1;
const signToken = (user) => jwt.sign(
  { userId: user._id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Register User
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!isMongoConnected()) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await localDb.createUser({ username, email, password: hashedPassword });

      if (result.exists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const token = signToken(result.user);
      return res.status(201).json({
        message: 'User registered successfully',
        user: { id: result.user._id, username: result.user.username, email: result.user.email },
        token,
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    const token = signToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser._id, username: newUser.username, email: newUser.email },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!isMongoConnected()) {
      const user = await localDb.findUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid password' });
      }

      const token = signToken(user);
      return res.status(200).json({
        message: 'Login successful',
        user: { id: user._id, username: user.username, email: user.email },
        token,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = signToken(user);

    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, username: user.username, email: user.email },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const users = await localDb.getUsers();
      return res.status(200).json(users);
    }

    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Search Users
exports.searchUsers = async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    if (!query) {
      return res.status(200).json([]);
    }

    if (!isMongoConnected()) {
      const users = await localDb.getUsers();
      const lowerQuery = query.toLowerCase();
      return res.status(200).json(users.filter((user) => (
        user.username.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
      )));
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    }).select('-password').limit(20);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!isMongoConnected()) {
      const user = await localDb.findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json(user);
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching current user', error: error.message });
  }
};

// Get User by ID
exports.getUserById = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const user = await localDb.findUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json(user);
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Update Presence
exports.updatePresence = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const userId = req.user.userId;

    if (!isMongoConnected()) {
      const user = await localDb.updatePresence(userId, isOnline);
      return res.status(200).json({ message: 'Presence updated', user });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isOnline: Boolean(isOnline), lastSeen: new Date() },
      { new: true }
    ).select('-password');

    res.status(200).json({ message: 'Presence updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating presence', error: error.message });
  }
};

// Update User Profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { username, status, profilePicture } = req.body;

    if (!isMongoConnected()) {
      const user = await localDb.updateUser(req.params.id, { username, status, profilePicture });
      return res.status(200).json({
        message: 'Profile updated successfully',
        user,
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, status, profilePicture },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};
