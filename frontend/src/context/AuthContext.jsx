import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiRequest, setTokens, clearTokens } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('garagego_access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiRequest('/auth/me');
      setUser(res.data.user);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setTokens(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (formData) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    setTokens(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout network error
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, reloadUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
