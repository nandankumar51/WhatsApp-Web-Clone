const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'local-db.json');

const defaultData = {
  users: [],
  chats: [],
  messages: [],
};

const now = () => new Date().toISOString();
const createId = () => crypto.randomBytes(12).toString('hex');

async function readData() {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    return { ...defaultData, ...JSON.parse(raw) };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(defaultData, null, 2));
    return { ...defaultData };
  }
}

async function writeData(data) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

function toPublicUser(user) {
  if (!user) return null;

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture || '',
    status: user.status || 'Hey there! I am using WhatsApp.',
    isOnline: Boolean(user.isOnline),
    lastSeen: user.lastSeen,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function populateMessage(data, message) {
  if (!message) return null;

  return {
    ...message,
    sender: toPublicUser(data.users.find((user) => user._id === message.sender)),
    receiver: toPublicUser(data.users.find((user) => user._id === message.receiver)),
  };
}

function populateChat(data, chat) {
  if (!chat) return null;

  return {
    ...chat,
    participants: chat.participants
      .map((id) => toPublicUser(data.users.find((user) => user._id === id)))
      .filter(Boolean),
    lastMessage: populateMessage(data, data.messages.find((message) => message._id === chat.lastMessage)),
  };
}

async function findUserByEmail(email) {
  const data = await readData();
  return data.users.find((user) => user.email === email.toLowerCase()) || null;
}

async function findUserById(userId) {
  const data = await readData();
  return toPublicUser(data.users.find((user) => user._id === userId));
}

async function createUser({ username, email, password }) {
  const data = await readData();
  const normalizedEmail = email.toLowerCase();
  const existingUser = data.users.find(
    (user) => user.email === normalizedEmail || user.username === username
  );

  if (existingUser) {
    return { exists: true, user: toPublicUser(existingUser) };
  }

  const timestamp = now();
  const user = {
    _id: createId(),
    username,
    email: normalizedEmail,
    password,
    profilePicture: '',
    status: 'Hey there! I am using WhatsApp.',
    isOnline: false,
    lastSeen: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  data.users.push(user);
  await writeData(data);
  return { exists: false, user: toPublicUser(user) };
}

async function getUsers() {
  const data = await readData();
  return data.users.map(toPublicUser);
}

async function updateUser(userId, updates) {
  const data = await readData();
  const user = data.users.find((item) => item._id === userId);

  if (!user) return null;

  user.username = updates.username || user.username;
  user.status = updates.status || user.status;
  user.profilePicture = updates.profilePicture || user.profilePicture;
  user.updatedAt = now();
  await writeData(data);
  return toPublicUser(user);
}

async function updatePresence(userId, isOnline) {
  const data = await readData();
  const user = data.users.find((item) => item._id === userId);

  if (!user) return null;

  user.isOnline = Boolean(isOnline);
  user.lastSeen = now();
  user.updatedAt = now();
  await writeData(data);
  return toPublicUser(user);
}

async function createOrGetChat(participantIds) {
  const data = await readData();
  const uniqueParticipantIds = [...new Set(participantIds)];
  let chat = data.chats.find((item) => {
    return (
      item.participants.length === uniqueParticipantIds.length &&
      uniqueParticipantIds.every((id) => item.participants.includes(id))
    );
  });

  if (!chat) {
    const timestamp = now();
    chat = {
      _id: createId(),
      participants: uniqueParticipantIds,
      lastMessage: null,
      lastMessageTime: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    data.chats.push(chat);
    await writeData(data);
  }

  return populateChat(data, chat);
}

async function createGroupChat({ chatName, participantIds, groupAdmin }) {
  const data = await readData();
  const timestamp = now();
  const uniqueParticipantIds = [...new Set([groupAdmin, ...participantIds].filter(Boolean))];
  const chat = {
    _id: createId(),
    chatName,
    isGroupChat: true,
    participants: uniqueParticipantIds,
    groupAdmin,
    lastMessage: null,
    lastMessageTime: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  data.chats.push(chat);
  await writeData(data);
  return populateChat(data, chat);
}

async function getUserChats(userId) {
  const data = await readData();
  return data.chats
    .filter((chat) => chat.participants.includes(userId))
    .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
    .map((chat) => populateChat(data, chat));
}

async function getChatById(chatId) {
  const data = await readData();
  return populateChat(data, data.chats.find((chat) => chat._id === chatId));
}

async function createMessage({ chatId, sender, receiver, text = '', attachments = [] }) {
  const data = await readData();
  const timestamp = now();
  const message = {
    _id: createId(),
    chatId,
    sender,
    receiver,
    text: text.trim(),
    messageType: attachments.length && text.trim() ? 'mixed' : attachments.length ? (attachments[0].type?.startsWith('image/') ? 'image' : 'file') : 'text',
    attachments,
    status: 'sent',
    deliveredTo: [],
    readBy: [],
    isRead: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  data.messages.push(message);

  const chat = data.chats.find((item) => item._id === chatId);
  if (chat) {
    chat.lastMessage = message._id;
    chat.lastMessageTime = timestamp;
    chat.updatedAt = timestamp;
  }

  await writeData(data);
  return populateMessage(data, message);
}

async function getMessagesByChat(chatId) {
  const data = await readData();
  return data.messages
    .filter((message) => message.chatId === chatId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((message) => populateMessage(data, message));
}

async function markMessageAsRead(messageId) {
  const data = await readData();
  const message = data.messages.find((item) => item._id === messageId);

  if (!message) return null;

  message.isRead = true;
  message.status = 'read';
  message.updatedAt = now();
  await writeData(data);
  return populateMessage(data, message);
}

async function clearMessagesByChat(chatId, userId) {
  const data = await readData();
  const chat = data.chats.find((item) => item._id === chatId);

  if (!chat || (userId && !chat.participants.includes(userId))) {
    return null;
  }

  const beforeCount = data.messages.length;
  data.messages = data.messages.filter((message) => message.chatId !== chatId);

  const timestamp = now();
  chat.lastMessage = null;
  chat.lastMessageTime = timestamp;
  chat.updatedAt = timestamp;

  await writeData(data);

  return {
    deletedCount: beforeCount - data.messages.length,
    chat: populateChat(data, chat),
  };
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getUsers,
  updateUser,
  updatePresence,
  createOrGetChat,
  createGroupChat,
  getUserChats,
  getChatById,
  createMessage,
  getMessagesByChat,
  markMessageAsRead,
  clearMessagesByChat,
};
