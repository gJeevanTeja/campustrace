import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authAPI.getProfile()
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        })
        .catch(() => {
          localStorage.clear();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    // 1. Call the robust login service (already normalizes details vs user pattern)
    const { data } = await authAPI.login(credentials);
    
    // 2. Extract normalized fields
    const access = data?.tokens?.access;
    const refresh = data?.tokens?.refresh;
    const userData = data?.user;

    // 3. Persist session
    if (access) localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
    
    if (userData) {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      if (import.meta.env.DEV) {
        console.log("👤 Auth session established:", userData.role, userData.email);
      }
    }

    return data;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    const access = data?.tokens?.access || data?.access;
    const refresh = data?.tokens?.refresh || data?.refresh;
    if (access) localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
    if (data.user) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      await authAPI.logout(refresh);
    } catch { }
    localStorage.clear();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(prev => {
      const updated = { ...prev, ...userData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};