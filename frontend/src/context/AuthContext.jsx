import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

// Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sayfa yüklendiğinde kullanıcıyı kontrol et
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Token varsa kullanıcı bilgilerini getir
          const response = await authService.getCurrentUser();
          setUser(response.data.user);
        }
      } catch (err) {
        // Token geçersizse temizle
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Giriş yap
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authService.login(email, password);
      
      if (response.success) {
        const { user, token } = response.data;
        authService.setStoredUser(user, token);
        setUser(user);
        return { success: true };
      } else {
        // Başarısız durumda hata fırlat
        throw new Error(response.message || 'Giriş başarısız');
      }
    } catch (err) {
      // API interceptor'dan gelen hata mesajı
      const message = err.message || 'Email veya şifre hatalı';
      setError(message);
      // Hatayı yukarı fırlat ki Login sayfası yakalasın
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Kayıt ol
  const register = useCallback(async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authService.register(userData);
      
      if (response.success) {
        const { user, token } = response.data;
        authService.setStoredUser(user, token);
        setUser(user);
        return { success: true };
      }
    } catch (err) {
      const message = err.message || 'Kayıt başarısız';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Çıkış yap
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
  }, []);

  // Şifre değiştir
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setError(null);
      const response = await authService.changePassword(currentPassword, newPassword);
      return { success: response.success };
    } catch (err) {
      const message = err.message || 'Şifre değiştirme başarısız';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // Kullanıcı bilgilerini güncelle
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  // Context değeri
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    changePassword,
    updateUser,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
