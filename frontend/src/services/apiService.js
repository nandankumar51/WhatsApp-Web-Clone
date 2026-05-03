import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to headers
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User APIs
export const registerUser = (data) => apiClient.post('/users/register', data);
export const loginUser = (data) => apiClient.post('/users/login', data);
export const getCurrentUser = () => apiClient.get('/users/me');
export const getAllUsers = () => apiClient.get('/users');
export const searchUsers = (query) => apiClient.get('/users/search', { params: { q: query } });
export const getUserById = (userId) => apiClient.get(`/users/${userId}`);
export const updateUserProfile = (userId, data) => apiClient.put(`/users/${userId}`, data);
export const updatePresence = (data) => apiClient.put('/users/me/presence', data);

// Chat APIs
export const createOrGetChat = (participantIds) => apiClient.post('/chats', { participantIds });
export const createGroupChat = (data) => apiClient.post('/chats/group', data);
export const getUserChats = (userId) => apiClient.get(`/chats/user/${userId}`);
export const getChatById = (chatId) => apiClient.get(`/chats/${chatId}`);

// Message APIs
export const sendMessage = (data) => apiClient.post('/messages', data);
export const getMessages = (chatId) => apiClient.get(`/messages/chat/${chatId}`);
export const markMessageAsRead = (messageId) => apiClient.put(`/messages/${messageId}/read`);
export const clearChatMessages = (chatId) => apiClient.delete(`/messages/chat/${chatId}`);

export default apiClient;
