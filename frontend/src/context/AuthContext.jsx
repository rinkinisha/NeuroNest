/**
 * context/AuthContext.jsx
 * Manages global authentication state using React Context API.
 * Persists user data + JWT token to localStorage.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const STORAGE_KEY = 'revision_os_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Initial auth check

  // ── Load user from localStorage on mount ──────────────────────────────────
  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setUser(parsed);
        // Verify token is still valid by fetching /me
        verifyToken(parsed.token);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const { data } = await API.get('/auth/me');
      // Update user with fresh data from server
      const freshUser = { ...data.data, token };
      setUser(freshUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser));
    } catch {
      // Token invalid – clear
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Signup ─────────────────────────────────────────────────────────────────
  const signup = useCallback(async (name, email, password) => {
    try {
      const { data } = await API.post('/auth/signup', { name, email, password });
      const userData = data.data;
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      toast.success(`Welcome to Revision OS, ${userData.name}! 🎉`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed. Try again.';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      const userData = data.data;
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      toast.success(`Welcome back, ${userData.name}! 👋`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Check credentials.';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Logged out successfully. See you soon! 👋');
  }, []);

  // ── Update user data locally ───────────────────────────────────────────────
  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const newUser = { ...prev, ...updatedData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for consuming auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
