import io from 'socket.io-client';

let socket = null;
let activeUser = null;

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const initializeSocket = (user) => {
  activeUser = user;

  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    if (activeUser?.id || activeUser?._id) {
      socket.emit('user_online', { userId: activeUser.id || activeUser._id });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const joinChat = (chatId) => {
  if (socket) {
    socket.emit('join_chat', chatId);
  }
};

export const leaveChat = (chatId) => {
  if (socket) {
    socket.emit('leave_chat', chatId);
  }
};

export const sendMessageSocket = (data) => {
  if (socket) {
    socket.emit('send_message', data);
  }
};

export const emitTypingStart = (data) => {
  if (socket) {
    socket.emit('typing_start', data);
  }
};

export const emitTypingStop = (data) => {
  if (socket) {
    socket.emit('typing_stop', data);
  }
};

export const markMessageRead = (data) => {
  if (socket) {
    socket.emit('message_read', data);
  }
};

export const emitChatCleared = (data) => {
  if (socket) {
    socket.emit('chat_cleared', data);
  }
};

export const onReceiveMessage = (callback) => {
  if (socket) {
    socket.on('receive_message', callback);
  }
};

export const onTypingStart = (callback) => {
  if (socket) {
    socket.on('typing_start', callback);
  }
};

export const onTypingStop = (callback) => {
  if (socket) {
    socket.on('typing_stop', callback);
  }
};

export const onPresenceChange = (callback) => {
  if (socket) {
    socket.on('presence_change', callback);
  }
};

export const onMessageRead = (callback) => {
  if (socket) {
    socket.on('message_read', callback);
  }
};

export const onChatCleared = (callback) => {
  if (socket) {
    socket.on('chat_cleared', callback);
  }
};

export const onConnectionStatus = ({ onConnect, onDisconnect, onReconnectAttempt }) => {
  if (!socket) return;

  if (onConnect) {
    socket.on('connect', onConnect);
    socket.io.on('reconnect', onConnect);

    if (socket.connected) {
      window.setTimeout(onConnect, 0);
    }
  }

  if (onDisconnect) {
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onDisconnect);
  }

  if (onReconnectAttempt) {
    socket.io.on('reconnect_attempt', onReconnectAttempt);
  }

  return () => {
    if (onConnect) {
      socket.off('connect', onConnect);
      socket.io.off('reconnect', onConnect);
    }

    if (onDisconnect) {
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onDisconnect);
    }

    if (onReconnectAttempt) {
      socket.io.off('reconnect_attempt', onReconnectAttempt);
    }
  };
};

export const removeMessageListener = () => {
  if (socket) {
    socket.off('receive_message');
    socket.off('typing_start');
    socket.off('typing_stop');
    socket.off('message_read');
    socket.off('chat_cleared');
  }
};
