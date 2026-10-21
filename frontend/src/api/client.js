import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Interceptor to inject Supabase Auth token
apiClient.interceptors.request.use(async (config) => {
  try {
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        config.headers.Authorization = `Bearer ${data.session.access_token}`;
      }
    } else {
      const demoToken = localStorage.getItem('yatra_demo_token');
      if (demoToken) {
        config.headers.Authorization = `Bearer ${demoToken}`;
      }
    }
  } catch (err) {
    console.warn('Auth token interceptor error:', err);
  }
  return config;
});

// Response error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);
