require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const User = require('./models/User');
const localDb = require('./services/localDb');

const app = express();
const server = http.createServer(app);

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const configuredAllowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || '').split(','),
]
  .map((origin) => origin?.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...configuredAllowedOrigins])];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const io = socketIo(server, {
  cors: corsOptions,
});
const onlineUsers = new Map();

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// MongoDB Connection
if (!process.env.MONGODB_URI) {
  console.log('MongoDB connection skipped: MONGODB_URI is not set.');
  console.log('Using local JSON storage. Set MONGODB_URI before deploying for persistent live data.');
} else {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 3000,
  })
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
      console.log('MongoDB connection error:', err.message);
      console.log('Using local JSON storage. For production, fix MONGODB_URI/IP access so data persists.');
    });
}

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'mongodb' : 'local-json',
    persistent: mongoose.connection.readyState === 1,
  });
});

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('user_online', async ({ userId }) => {
    if (!userId) return;

    socket.data.userId = userId;
    onlineUsers.set(userId, socket.id);

    try {
      if (mongoose.connection.readyState === 1) {
        await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      } else {
        await localDb.updatePresence(userId, true);
      }
    } catch (error) {
      console.log('Presence update failed:', error.message);
    }

    socket.broadcast.emit('presence_change', { userId, isOnline: true });
  });

  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on('leave_chat', (chatId) => {
    socket.leave(chatId);
  });

  socket.on('send_message', (data) => {
    io.to(data.chatId).emit('receive_message', data);
    socket.to(data.chatId).emit('message_delivered', {
      messageId: data._id,
      chatId: data.chatId,
      deliveredAt: new Date(),
    });
  });

  socket.on('typing_start', (data) => {
    socket.to(data.chatId).emit('typing_start', data);
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.chatId).emit('typing_stop', data);
  });

  socket.on('message_read', (data) => {
    socket.to(data.chatId).emit('message_read', {
      ...data,
      readAt: new Date(),
    });
  });

  socket.on('chat_cleared', (data) => {
    if (!data?.chatId) return;
    socket.to(data.chatId).emit('chat_cleared', {
      chatId: data.chatId,
      clearedAt: new Date(),
    });
  });

  socket.on('disconnect', async () => {
    const userId = socket.data.userId;
    if (userId) {
      onlineUsers.delete(userId);

      try {
        if (mongoose.connection.readyState === 1) {
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        } else {
          await localDb.updatePresence(userId, false);
        }
      } catch (error) {
        console.log('Presence update failed:', error.message);
      }

      socket.broadcast.emit('presence_change', {
        userId,
        isOnline: false,
        lastSeen: new Date(),
      });
    }

    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
