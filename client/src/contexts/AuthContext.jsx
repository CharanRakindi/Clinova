import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
      return response.data.data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Axios refresh failure → clear session
  useEffect(() => {
    const onAuthExpired = () => setUser(null);
    window.addEventListener('clinova:auth-expired', onAuthExpired);
    return () => window.removeEventListener('clinova:auth-expired', onAuthExpired);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    // Prefer full profile from /me so mustChangePassword and other flags are present
    const me = await fetchUser();
    return { ...response.data, data: me || response.data.data };
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // still clear local session
    } finally {
      setUser(null);
    }
  };

  const register = async (userData) => {
    const { role: _ignored, ...payload } = userData || {};
    const response = await api.post('/auth/register', payload);
    const me = await fetchUser();
    return { ...response.data, data: me || response.data.data };
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    fetchUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
