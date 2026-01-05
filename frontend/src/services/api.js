import axios from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 saniye timeout
});

// Request interceptor - Token ekleme
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Hata yönetimi
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 Unauthorized - Token geçersiz veya süresi dolmuş
    if (error.response?.status === 401) {
      // Auth sayfalarında (login, forgot-password, reset-password) yönlendirme yapma
      const authPages = ['/login', '/forgot-password', '/reset-password'];
      const isAuthPage = authPages.some(page => window.location.pathname.startsWith(page));
      
      if (!isAuthPage) {
        // Sadece korumalı sayfalardayken yönlendir
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Hata mesajını çıkar
    const message = error.response?.data?.message || error.message || 'Bir hata oluştu';
    
    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default api;
