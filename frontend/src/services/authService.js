import api from './api';

// Auth API endpoints
const authService = {
  // Kullanıcı girişi
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Kullanıcı kaydı
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Mevcut kullanıcı bilgilerini getir
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Şifre değiştir
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Çıkış yap
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Token kontrolü
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Kayıtlı kullanıcı bilgilerini getir
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Kullanıcı bilgilerini kaydet
  setStoredUser: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  },

  // Şifre sıfırlama talebi (Email gönder)
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Şifre sıfırlama (Token ile)
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

export default authService;
