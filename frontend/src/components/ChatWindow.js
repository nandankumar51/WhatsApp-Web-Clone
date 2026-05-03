import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as apiService from '../services/apiService';
import * as socketService from '../services/socketService';
import Avatar from './ui/Avatar';
import EmptyState from './ui/EmptyState';
import TypingIndicator from './ui/TypingIndicator';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import '../styles/ChatWindow.css';
import { getUserId, groupMessagesByDate } from '../utils/formatters';

const MUTED_CHATS_STORAGE_KEY = 'whatsappCloneMutedChats';

function readMutedChats() {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.localStorage.getItem(MUTED_CHATS_STORAGE_KEY) || '{}');
  } catch (error) {
    console.warn('Could not read muted chats:', error);
    return {};
  }
}

function ChatWindow({ chat, currentUser, onMessageSent, onlineUsers, onBack, chatPreferences }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [mutedChats, setMutedChats] = useState(readMutedChats);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageRefs = useRef({});
  const currentUserId = useMemo(() => getUserId(currentUser), [currentUser]);

  const getOtherUser = useCallback(() => {
    return chat.participants.find((p) => p._id !== currentUserId);
  }, [chat.participants, currentUserId]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getMessages(chat._id);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chat._id]);

  const handleReceiveMessage = useCallback((data) => {
    if (data.chatId === chat._id || data.chatId?._id === chat._id) {
      setMessages((prev) => {
        if (prev.some((message) => message._id === data._id)) return prev;
        return [...prev, data];
      });
    }
  }, [chat._id]);

  const handleChatCleared = useCallback((data) => {
    if (data.chatId !== chat._id) return;

    setMessages([]);
    setSearchQuery('');
    setActiveMatchIndex(0);
    setClearConfirmOpen(false);
    onMessageSent?.();
  }, [chat._id, onMessageSent]);

  useEffect(() => {
    fetchMessages();
    socketService.joinChat(chat._id);
    socketService.onReceiveMessage(handleReceiveMessage);
    socketService.onTypingStart((data) => {
      if (data.chatId === chat._id && data.userId !== currentUserId) {
        setTypingUser(data.username || 'Someone');
      }
    });
    socketService.onTypingStop((data) => {
      if (data.chatId === chat._id && data.userId !== currentUserId) {
        setTypingUser(null);
      }
    });
    socketService.onChatCleared(handleChatCleared);

    return () => {
      socketService.leaveChat(chat._id);
      socketService.removeMessageListener();
    };
  }, [chat._id, currentUserId, fetchMessages, handleChatCleared, handleReceiveMessage]);

  useEffect(() => {
    if (chatPreferences?.autoScroll !== false) {
      scrollToBottom();
    }
  }, [messages, chatPreferences?.autoScroll]);

  const searchMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return messages.filter((message) => (
      message.text?.toLowerCase().includes(query) ||
      message.attachments?.some((attachment) => attachment.name?.toLowerCase().includes(query))
    ));
  }, [messages, searchQuery]);

  useEffect(() => {
    setActiveMatchIndex(0);
    setClearConfirmOpen(false);
  }, [searchQuery, chat._id]);

  useEffect(() => {
    const activeMessage = searchMatches[activeMatchIndex];
    if (!activeMessage) return;

    messageRefs.current[activeMessage._id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activeMatchIndex, searchMatches]);

  const handleSendMessage = async ({ text, attachments }) => {
    const otherUser = getOtherUser();
    const tempId = `temp-${Date.now()}`;

    const messageData = {
      chatId: chat._id,
      sender: currentUserId,
      receiver: otherUser?._id,
      text,
      attachments,
    };

    const optimisticMessage = {
      ...messageData,
      _id: tempId,
      sender: currentUserId,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await apiService.sendMessage(messageData);
      const savedMessage = response.data.data;
      setMessages((prev) => prev.map((message) => (
        message._id === tempId ? { ...savedMessage, status: savedMessage.status || 'sent' } : message
      )));
      socketService.sendMessageSocket({
        ...savedMessage,
        chatId: chat._id,
      });
      onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const element = messagesContainerRef.current;
    if (!element) return;

    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    setShowScrollButton(distanceFromBottom > 160);
  };

  const goToNextMatch = () => {
    if (!searchMatches.length) return;
    setActiveMatchIndex((index) => (index + 1) % searchMatches.length);
  };

  const goToPreviousMatch = () => {
    if (!searchMatches.length) return;
    setActiveMatchIndex((index) => (index - 1 + searchMatches.length) % searchMatches.length);
  };

  const handleToggleMute = () => {
    setMutedChats((previousMutedChats) => {
      const nextMutedChats = { ...previousMutedChats };

      if (nextMutedChats[chat._id]) {
        delete nextMutedChats[chat._id];
      } else {
        nextMutedChats[chat._id] = {
          mutedAt: new Date().toISOString(),
          chatName: chat.isGroupChat ? chat.chatName : getOtherUser()?.username,
        };
      }

      try {
        window.localStorage.setItem(MUTED_CHATS_STORAGE_KEY, JSON.stringify(nextMutedChats));
      } catch (error) {
        console.warn('Could not save muted chat:', error);
      }

      return nextMutedChats;
    });
  };

  const handleClearChat = async () => {
    if (isClearingChat) return;

    try {
      setIsClearingChat(true);
      await apiService.clearChatMessages(chat._id);
      setMessages([]);
      setSearchQuery('');
      setActiveMatchIndex(0);
      setClearConfirmOpen(false);
      socketService.emitChatCleared({ chatId: chat._id });
      onMessageSent?.();
    } catch (error) {
      console.error('Error clearing chat:', error);
    } finally {
      setIsClearingChat(false);
    }
  };

  const otherUser = getOtherUser();
  const groupedMessages = groupMessagesByDate(messages);
  const otherUserOnline = onlineUsers[otherUser?._id] || otherUser?.isOnline;
  const activeMatchId = searchMatches[activeMatchIndex]?._id;
  const sharedMediaCount = messages.reduce((count, message) => count + (message.attachments?.length || 0), 0);
  const isChatMuted = Boolean(mutedChats[chat._id]);

  return (
    <div className={`chat-window wallpaper-${chatPreferences?.wallpaper?.toLowerCase() || 'dotted'} bubbles-${chatPreferences?.bubbleStyle?.toLowerCase() || 'soft'} font-${chatPreferences?.fontSize?.toLowerCase() || 'comfort'}`}>
      <div className="chat-window-header">
        <button type="button" className="mobile-back-button" onClick={onBack}>Back</button>
        <div className="chat-header-info">
          <Avatar user={otherUser} isOnline={otherUserOnline} />
          <div>
            <h3>{chat.isGroupChat ? chat.chatName : otherUser?.username}</h3>
            <p className="user-status">
              {typingUser ? `${typingUser} is typing...` : otherUserOnline ? 'Online now' : (otherUser?.lastSeen ? `Last seen ${new Date(otherUser.lastSeen).toLocaleString()}` : otherUser?.status)}
            </p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            type="button"
            className="icon-action close-chat-action"
            title="Close this chat"
            onClick={() => {
              setIsSearchOpen(false);
              setIsInfoOpen(false);
              onBack?.();
            }}
          >
            Close
          </button>
          <button
            type="button"
            className={`icon-action ${isSearchOpen ? 'active' : ''}`}
            title="Search messages"
            onClick={() => setIsSearchOpen((value) => !value)}
          >
            Search
          </button>
          <button
            type="button"
            className={`icon-action ${isInfoOpen ? 'active' : ''}`}
            title="Chat info"
            onClick={() => setIsInfoOpen((value) => !value)}
          >
            Info
          </button>
        </div>
      </div>

      {isSearchOpen ? (
        <div className="chat-search-panel">
          <div className="chat-search-input-wrap">
            <span>Search</span>
            <input
              autoFocus
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Find messages, files, or links"
            />
          </div>
          <div className="chat-search-controls">
            <strong>
              {searchQuery.trim()
                ? `${searchMatches.length ? activeMatchIndex + 1 : 0}/${searchMatches.length}`
                : '0/0'}
            </strong>
            <button type="button" onClick={goToPreviousMatch} disabled={!searchMatches.length}>Prev</button>
            <button type="button" onClick={goToNextMatch} disabled={!searchMatches.length}>Next</button>
            <button type="button" onClick={() => {
              setSearchQuery('');
              setIsSearchOpen(false);
            }}>
              Close
            </button>
          </div>
        </div>
      ) : null}

      <div className="messages-container" ref={messagesContainerRef} onScroll={handleScroll}>
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length > 0 ? (
          groupedMessages.map((group) => (
            <React.Fragment key={group.label}>
              <div className="date-separator"><span>{group.label}</span></div>
              {group.messages.map((message) => {
                const senderId = message.sender?._id || message.sender;
                const isSent = senderId === currentUserId;

                return (
                  <ChatBubble
                    key={message._id}
                    ref={(element) => {
                      if (element) messageRefs.current[message._id] = element;
                    }}
                    message={message}
                    isSent={isSent}
                    searchQuery={searchQuery}
                    isActiveSearchMatch={activeMatchId === message._id}
                  />
                );
              })}
            </React.Fragment>
          ))
        ) : (
          <EmptyState
            icon="Start"
            title="No messages yet"
            description="Send the first message and the conversation will appear here."
          />
        )}
        {typingUser ? <TypingIndicator name={typingUser} /> : null}
        <div ref={messagesEndRef} />
      </div>

      {showScrollButton ? (
        <button type="button" className="scroll-bottom-button" onClick={scrollToBottom}>
          New
        </button>
      ) : null}

      <MessageInput
        onSendMessage={handleSendMessage}
        chatPreferences={chatPreferences}
        onTypingStart={() => socketService.emitTypingStart({
          chatId: chat._id,
          userId: currentUserId,
          username: currentUser.username,
        })}
        onTypingStop={() => socketService.emitTypingStop({
          chatId: chat._id,
          userId: currentUserId,
          username: currentUser.username,
        })}
      />

      {isInfoOpen ? (
        <aside className="chat-info-panel">
          <div className="chat-info-header">
            <button type="button" className="icon-action" onClick={() => setIsInfoOpen(false)}>Close</button>
            <p>{chat.isGroupChat ? 'Group info' : 'Contact info'}</p>
          </div>

          <div className="chat-info-profile">
            <Avatar user={chat.isGroupChat ? { username: chat.chatName } : otherUser} size="xl" isOnline={otherUserOnline} />
            <h2>{chat.isGroupChat ? chat.chatName : otherUser?.username}</h2>
            <p>{chat.isGroupChat ? `${chat.participants.length} members` : otherUser?.email}</p>
            <span className={otherUserOnline ? 'info-presence online' : 'info-presence'}>
              {otherUserOnline ? 'Online now' : otherUser?.lastSeen ? `Last seen ${new Date(otherUser.lastSeen).toLocaleString()}` : 'Offline'}
            </span>
          </div>

          <div className="chat-info-card">
            <span>About</span>
            <p>{chat.isGroupChat ? 'Group conversation for realtime collaboration.' : (otherUser?.status || 'No status set yet.')}</p>
          </div>

          <div className="chat-info-card">
            <span>Notifications</span>
            <p>{isChatMuted ? 'This chat is muted on this device.' : 'Notifications are active for this chat.'}</p>
          </div>

          <div className="chat-info-grid">
            <div>
              <strong>{messages.length}</strong>
              <span>Messages</span>
            </div>
            <div>
              <strong>{sharedMediaCount}</strong>
              <span>Media</span>
            </div>
          </div>

          <div className="chat-info-actions">
            <button
              type="button"
              className={isChatMuted ? 'success-action' : ''}
              onClick={handleToggleMute}
            >
              {isChatMuted ? 'Unmute chat' : 'Mute chat'}
            </button>
            <button
              type="button"
              className="danger-action"
              onClick={() => setClearConfirmOpen(true)}
              disabled={isClearingChat || messages.length === 0}
            >
              {messages.length === 0 ? 'Chat already clear' : 'Clear chat'}
            </button>
          </div>

          {clearConfirmOpen ? (
            <div className="chat-clear-confirm">
              <span>Clear conversation?</span>
              <p>This removes all messages in this chat from the current demo database.</p>
              <div>
                <button type="button" onClick={() => setClearConfirmOpen(false)} disabled={isClearingChat}>
                  Cancel
                </button>
                <button type="button" className="danger-action" onClick={handleClearChat} disabled={isClearingChat}>
                  {isClearingChat ? 'Clearing...' : 'Clear messages'}
                </button>
              </div>
            </div>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

export default ChatWindow;
