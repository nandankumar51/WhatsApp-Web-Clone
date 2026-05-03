import React, { useEffect, useRef, useState } from 'react';
import Avatar from './ui/Avatar';
import EmptyState from './ui/EmptyState';
import Skeleton from './ui/Skeleton';
import SettingsDetailScreen from './SettingsDetailScreen';
import '../styles/ChatList.css';
import { formatChatTime, getUserId } from '../utils/formatters';

function ChatList({
  chats,
  selectedChat,
  onSelectChat,
  currentUser,
  loading,
  showUsersList,
  users,
  onShowUsersList,
  onStartChat,
  onlineUsers,
  theme,
  onToggleTheme,
  onLogout,
  onUserUpdate,
  chatPreferences,
  onChatPreferencesChange,
}) {
  const [showProfileView, setShowProfileView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProfileSection, setActiveProfileSection] = useState('Profile');
  const [settingsScreen, setSettingsScreen] = useState(null);
  const profileOverlayRef = useRef(null);

  const currentUserId = getUserId(currentUser);

  const getOtherUser = (chat) => chat.participants.find((p) => p._id !== currentUserId);
  const getChatTitle = (chat) => (chat.isGroupChat ? chat.chatName : getOtherUser(chat)?.username);
  const getChatAvatarUser = (chat) => (chat.isGroupChat ? { username: chat.chatName } : getOtherUser(chat));

  useEffect(() => {
    if (!showProfileView) return;

    profileOverlayRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [showProfileView, settingsScreen]);

  const filteredUsers = users.filter((user) => {
    const query = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.status?.toLowerCase().includes(query)
    );
  });

  const filteredChats = chats.filter((chat) => {
    const otherUser = getOtherUser(chat);
    const query = searchTerm.toLowerCase();

    return (
      chat.chatName?.toLowerCase().includes(query) ||
      otherUser?.username?.toLowerCase().includes(query) ||
      otherUser?.email?.toLowerCase().includes(query) ||
      chat.lastMessage?.text?.toLowerCase().includes(query)
    );
  });

  const profileSections = [
    { title: 'Profile', description: 'Name, profile photo, status', icon: 'PR' },
    { title: 'Account', description: 'Security notifications, account info', icon: 'AC' },
    { title: 'Privacy', description: 'Blocked contacts, disappearing messages', icon: 'PV' },
    { title: 'Chats', description: 'Theme, wallpaper, chat settings', icon: 'CH' },
    { title: 'Notifications', description: 'Messages, groups, sounds', icon: 'NT' },
    { title: 'Shortcuts', description: 'Keyboard and productivity settings', icon: 'SC' },
  ];

  return (
    <div className={`chat-list-container ${chatPreferences?.compactMode ? 'compact-chat-list' : ''}`}>
      {showProfileView && (
        <div
          ref={profileOverlayRef}
          className={`profile-view-overlay ${settingsScreen ? 'has-detail-screen' : ''}`}
        >
          <div className="profile-view-header">
            <button type="button" className="back-btn" onClick={() => {
              setSettingsScreen(null);
              setShowProfileView(false);
            }}>
              Back
            </button>
            <h2>{currentUser.username}</h2>
          </div>

          <div className="profile-search">
            <div className="search-box-wrapper">
              <span className="search-icon">Find</span>
              <input type="text" placeholder="Search" />
            </div>
          </div>

          <button
            type="button"
            className="profile-main-info profile-card-button"
            onClick={() => {
              setActiveProfileSection('Profile');
              setSettingsScreen('Profile');
            }}
          >
            <div className="status-badge">{currentUser.status || 'Busy'}</div>
            <Avatar user={currentUser} size="xl" isOnline />
            <div className="profile-card-name">{currentUser.username}</div>
            <div className="profile-card-email">{currentUser.email}</div>
          </button>

          <div className="profile-active-section">
            <p className="profile-active-label">Selected</p>
            <h3>{activeProfileSection}</h3>
          </div>

          <div className="profile-settings-list">
            {profileSections.map((section) => (
              <button
                key={section.title}
                type="button"
                className={`settings-item ${activeProfileSection === section.title ? 'selected' : ''}`}
                onClick={() => {
                  setActiveProfileSection(section.title);
                  setSettingsScreen(section.title);
                }}
              >
                <span className="settings-icon">{section.icon}</span>
                <div className="settings-text">
                  <h4>{section.title}</h4>
                  {section.description ? <p>{section.description}</p> : null}
                </div>
              </button>
            ))}
          </div>

          {settingsScreen ? (
            <SettingsDetailScreen
              key={settingsScreen}
              section={settingsScreen}
              currentUser={currentUser}
              theme={theme}
              onToggleTheme={onToggleTheme}
              onUserUpdate={onUserUpdate}
              chatPreferences={chatPreferences}
              onChatPreferencesChange={onChatPreferencesChange}
              onBack={() => setSettingsScreen(null)}
            />
          ) : null}
        </div>
      )}

      <div className="chat-list-header">
        <div className="chat-list-title-row">
          <div>
            <p className="sidebar-kicker">Messages</p>
            <h2>WhatsApp</h2>
          </div>
          <div className="chat-list-actions">
            <button type="button" className="icon-button primary-icon" onClick={onShowUsersList} title="New Chat">
              +
            </button>
            <button type="button" className="icon-button" onClick={onToggleTheme} title="Toggle theme">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button type="button" className="icon-button" onClick={() => setShowProfileView(true)} title="Profile">
              ...
            </button>
          </div>
        </div>
        <div className="chat-search-bar">
          <span className="chat-search-icon">Search</span>
          <input
            type="text"
            placeholder="Search or start a new chat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {showUsersList && (
        <div className="users-list">
          <div className="users-list-header">
            <h3>Select User</h3>
            <button type="button" className="close-users-btn" onClick={onShowUsersList}>
              Close
            </button>
          </div>
          <div className="users-items">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <button key={user._id} type="button" className="user-item" onClick={() => onStartChat(user)}>
                  <Avatar user={user} isOnline={onlineUsers[user._id] || user.isOnline} />
                  <div className="user-info">
                    <p className="user-name">{user.username}</p>
                    <p className="user-status">{onlineUsers[user._id] || user.isOnline ? 'Online now' : user.status}</p>
                  </div>
                </button>
              ))
            ) : (
              <EmptyState
                icon="No"
                title="No contacts found"
                description="Register another user in an incognito window to start a demo chat."
              />
            )}
          </div>
        </div>
      )}

      <div className="chat-items">
        {loading ? (
          <Skeleton count={5} />
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => {
            const otherUser = getOtherUser(chat);
            const isSelected = selectedChat && selectedChat._id === chat._id;
            const unreadCount = chat.unreadCount || 0;

            return (
              <button
                key={chat._id}
                className={`chat-item ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectChat(chat)}
              >
                <Avatar
                  user={getChatAvatarUser(chat)}
                  isOnline={!chat.isGroupChat && (onlineUsers[otherUser?._id] || otherUser?.isOnline)}
                />
                <div className="chat-item-info">
                  <div className="chat-item-topline">
                    <p className="chat-name">{getChatTitle(chat)}</p>
                    <span className="chat-time">{formatChatTime(chat.lastMessageTime || chat.updatedAt)}</span>
                  </div>
                  <p className="last-message">
                    {chat.lastMessage ? (chat.lastMessage.text || 'Media message') : 'No messages yet'}
                  </p>
                </div>
                {unreadCount > 0 ? <span className="unread-badge">{unreadCount}</span> : null}
              </button>
            );
          })
        ) : (
          <EmptyState
            icon="Chat"
            title="No chats found"
            description="Start a new conversation from the plus button."
          />
        )}
      </div>

      <div className="current-user-row">
        <button type="button" className="current-user-profile" onClick={() => setShowProfileView(true)} title="Open profile">
          <Avatar user={currentUser} isOnline />
          <div className="current-user-details">
            <p className="my-name">{currentUser.username}</p>
            <p className="my-username">{currentUser.email}</p>
          </div>
        </button>
        <button type="button" className="logout-chip" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

export default ChatList;
