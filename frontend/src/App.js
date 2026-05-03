import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChatPage from './pages/ChatPage';
import NotFoundPage from './pages/NotFoundPage';
import './styles/App.css';

const defaultChatPreferences = {
  wallpaper: 'Dotted',
  bubbleStyle: 'Soft',
  fontSize: 'Comfort',
  mediaQuality: 'Balanced',
  compactMode: false,
  enterToSend: true,
  mediaPreview: true,
  linkPreview: true,
  autoScroll: true,
  highQualityMedia: false,
  keepArchived: true,
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [chatPreferences, setChatPreferences] = useState(() => {
    try {
      return {
        ...defaultChatPreferences,
        ...JSON.parse(localStorage.getItem('chatPreferences') || '{}'),
      };
    } catch (error) {
      return defaultChatPreferences;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('chatPreferences', JSON.stringify(chatPreferences));
  }, [chatPreferences]);

  const handleLogin = (user, token) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleUserUpdate = (user) => {
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleChatPreferencesChange = (updates) => {
    setChatPreferences((value) => ({ ...value, ...updates }));
  };

  return (
    <Router>
      <Routes>
        <Route path="/welcome" element={!isLoggedIn ? <WelcomePage /> : <Navigate to="/chat" />} />
        <Route path="/login" element={!isLoggedIn ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/chat" />} />
        <Route path="/register" element={!isLoggedIn ? <RegisterPage onRegister={handleLogin} /> : <Navigate to="/chat" />} />
        <Route path="/forgot-password" element={!isLoggedIn ? <ForgotPasswordPage /> : <Navigate to="/chat" />} />
        <Route
          path="/chat"
          element={isLoggedIn ? (
            <ChatPage
              currentUser={currentUser}
              onLogout={handleLogout}
              theme={theme}
              onToggleTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
              onUserUpdate={handleUserUpdate}
              chatPreferences={chatPreferences}
              onChatPreferencesChange={handleChatPreferencesChange}
            />
          ) : <Navigate to="/login" />}
        />
        <Route path="/" element={isLoggedIn ? <Navigate to="/chat" /> : <Navigate to="/welcome" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
