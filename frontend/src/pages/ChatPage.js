import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import EmptyState from '../components/ui/EmptyState';
import Toast from '../components/ui/Toast';
import * as socketService from '../services/socketService';
import * as apiService from '../services/apiService';
import '../styles/ChatPage.css';
import { getUserId } from '../utils/formatters';

function ChatPage({
  currentUser,
  onLogout,
  theme,
  onToggleTheme,
  onUserUpdate,
  chatPreferences,
  onChatPreferencesChange,
}) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUsersList, setShowUsersList] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [connectionMessage, setConnectionMessage] = useState('');
  const navigate = useNavigate();
  const currentUserId = useMemo(() => getUserId(currentUser), [currentUser]);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserChats(currentUserId);
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setConnectionMessage('Could not load chats. Check your backend or MongoDB connection.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiService.getAllUsers();
      const filteredUsers = response.data.filter((user) => user._id !== currentUserId);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setConnectionMessage('Could not load contacts. Try again after the server reconnects.');
    }
  }, [currentUserId]);

  useEffect(() => {
    socketService.initializeSocket(currentUser);
    fetchChats();
    fetchUsers();

    const removeConnectionStatusListeners = socketService.onConnectionStatus({
      onConnect: () => setConnectionMessage(''),
      onDisconnect: () => setConnectionMessage('Connection lost. Reconnecting...'),
      onReconnectAttempt: () => setConnectionMessage('Reconnecting to realtime server...'),
    });

    socketService.onPresenceChange(({ userId, isOnline }) => {
      setOnlineUsers((value) => ({ ...value, [userId]: isOnline }));
    });

    return () => {
      removeConnectionStatusListeners?.();
    };
  }, [currentUser, fetchChats, fetchUsers]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setShowUsersList(false);
  };

  const handleStartChat = async (user) => {
    try {
      const response = await apiService.createOrGetChat([currentUserId, user._id]);
      handleSelectChat(response.data);
      await fetchChats();
    } catch (error) {
      console.error('Error starting chat:', error);
      setConnectionMessage('Could not start chat. Please try again.');
    }
  };

  const handleLogout = () => {
    socketService.getSocket()?.disconnect();
    onLogout();
    navigate('/login');
  };

  return (
    <div className={`chat-page ${selectedChat ? 'chat-open' : ''}`}>
      <Toast message={connectionMessage} tone="warning" />
      <div className="chat-container">
        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={handleSelectChat}
          currentUser={currentUser}
          loading={loading}
          showUsersList={showUsersList}
          users={users}
          onShowUsersList={() => setShowUsersList(!showUsersList)}
          onStartChat={handleStartChat}
          onlineUsers={onlineUsers}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onLogout={handleLogout}
          onUserUpdate={onUserUpdate}
          chatPreferences={chatPreferences}
          onChatPreferencesChange={onChatPreferencesChange}
        />

        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            currentUser={currentUser}
            onMessageSent={fetchChats}
            onlineUsers={onlineUsers}
            onBack={() => setSelectedChat(null)}
            chatPreferences={chatPreferences}
          />
        ) : (
          <div className="no-chat-selected">
            <EmptyState
              icon="✦"
              title="Welcome to WhatsApp Clone"
              description="Choose a conversation or start a new one. Your polished messaging workspace is ready."
              actionLabel="Start New Chat"
              onAction={() => setShowUsersList(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPage;
