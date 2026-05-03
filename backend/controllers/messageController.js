const Message = require('../models/Message');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');
const localDb = require('../services/localDb');

const isMongoConnected = () => mongoose.connection.readyState === 1;

// Send Message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, sender, receiver, text = '', attachments = [] } = req.body;

    if (!chatId || !sender) {
      return res.status(400).json({ message: 'Chat and sender are required' });
    }

    if (!text.trim() && attachments.length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (!isMongoConnected()) {
      const message = await localDb.createMessage({ chatId, sender, receiver, text, attachments });
      return res.status(201).json({
        message: 'Message sent successfully',
        data: message,
      });
    }

    const message = new Message({
      chatId,
      sender,
      receiver,
      text: text.trim(),
      attachments,
      messageType: attachments.length && text.trim()
        ? 'mixed'
        : attachments.length
          ? (attachments[0].type?.startsWith('image/') ? 'image' : 'file')
          : 'text',
      status: 'sent',
    });

    await message.save();

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageTime: new Date(),
    });

    const populatedMessage = await message.populate('sender receiver', '-password');

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Get Messages for a Chat
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!isMongoConnected()) {
      const messages = await localDb.getMessagesByChat(chatId);
      return res.status(200).json(messages);
    }

    const messages = await Message.find({ chatId })
      .populate('sender receiver', '-password')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Mark Message as Read
exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!isMongoConnected()) {
      const message = await localDb.markMessageAsRead(messageId);
      return res.status(200).json({
        message: 'Message marked as read',
        data: message,
      });
    }

    const update = {
      isRead: true,
      status: 'read',
    };

    if (req.body.userId) {
      update.$addToSet = { readBy: req.body.userId };
    }

    const message = await Message.findByIdAndUpdate(messageId, update, { new: true });

    res.status(200).json({
      message: 'Message marked as read',
      data: message,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error marking message as read', error: error.message });
  }
};

// Clear all messages in a chat
exports.clearChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.userId;

    if (!chatId || !userId) {
      return res.status(400).json({ message: 'Chat and user are required' });
    }

    if (!isMongoConnected()) {
      const result = await localDb.clearMessagesByChat(chatId, userId);

      if (!result) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      return res.status(200).json({
        message: 'Chat cleared successfully',
        data: result,
      });
    }

    const chat = await Chat.findOne({ _id: chatId, participants: userId });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const result = await Message.deleteMany({ chatId });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: null,
      lastMessageTime: new Date(),
    });

    res.status(200).json({
      message: 'Chat cleared successfully',
      data: {
        deletedCount: result.deletedCount || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing chat', error: error.message });
  }
};
