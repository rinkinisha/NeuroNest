/**
 * api/axios.js – Configured Axios instance for Revision OS
 * Auto-attaches JWT token and handles 401 responses.
 */

import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: Attach JWT token ─────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const userData = localStorage.getItem('revision_os_user');
    if (userData) {
      const { token } = JSON.parse(userData);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 Unauthorized ─────────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid – clear storage and redirect to login
      localStorage.removeItem('revision_os_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
