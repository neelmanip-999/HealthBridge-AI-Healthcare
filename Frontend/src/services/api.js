import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Must match your backend port
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['auth-token'] = token;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;