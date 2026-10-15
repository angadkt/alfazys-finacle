import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'https://infazys-api.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('infazys_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');

      if (!isLoginRequest) {
        // Clear token and active session
        localStorage.removeItem('infazys_token');
        localStorage.removeItem('infazys_finacle_active_role');
        
        // Redirect to login if not already there, debounced across concurrent requests
        if (!isRedirecting && window.location.pathname !== '/' && window.location.pathname !== '/login') {
          isRedirecting = true;
          sessionStorage.setItem('infazys_session_expired', 'true');
          window.location.href = '/?session_expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
