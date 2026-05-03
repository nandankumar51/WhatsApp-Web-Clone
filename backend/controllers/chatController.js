const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const localDb = require('../services/localDb');

const isMongoConnected = () => mongoose.connection.readyState === 1;

// Create or Get Chat
exports.createOrGetChat = async (req, res) => {
  try {
    const { participantIds } = req.body;

    if (!participantIds || participantIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 participants are required' });
    }

    if (!isMongoConnected()) {
      const chat = await localDb.createOrGetChat(participantIds);
      return res.status(200).json(chat);
    }

    let chat = await Chat.findOne({
      participants: { $all: participantIds },
    }).populate('participants', '-password');

    if (!chat) {
      chat = new Chat({ participants: participantIds });
      await chat.save();
      chat = await chat.populate('participants', '-password');
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error creating/getting chat', error: error.message });
  }
};

// Create Group Chat
exports.createGroupChat = async (req, res) => {
  try {
    const { chatName, participantIds = [] } = req.body;
    const groupAdmin = req.user.userId;

    if (!chatName || chatName.trim().length < 2) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    if (participantIds.length < 1) {
      return res.status(400).json({ message: 'At least one group member is required' });
    }

    if (!isMongoConnected()) {
      const chat = await localDb.createGroupChat({
        chatName: chatName.trim(),
        participantIds,
        groupAdmin,
      });
      return res.status(201).json(chat);
    }

    let chat = new Chat({
      chatName: chatName.trim(),
      isGroupChat: true,
      participants: [...new Set([groupAdmin, ...participantIds])],
      groupAdmin,
    });

    await chat.save();
    chat = await chat.populate('participants groupAdmin', '-password');
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error creating group chat', error: error.message });
  }
};

// Get All Chats for a User
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!isMongoConnected()) {
      const chats = await localDb.getUserChats(userId);
      return res.status(200).json(chats);
    }

    const chats = await Chat.find({ participants: userId })
      .populate('participants', '-password')
      .populate('lastMessage')
      .populate('groupAdmin', '-password')
      .sort({ lastMessageTime: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chats', error: error.message });
  }
};

// Get Chat by ID
exports.getChatById = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const chat = await localDb.getChatById(req.params.chatId);

      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      return res.status(200).json(chat);
    }

    const chat = await Chat.findById(req.params.chatId)
      .populate('participants', '-password')
      .populate('lastMessage')
      .populate('groupAdmin', '-password');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat', error: error.message });
  }
};
