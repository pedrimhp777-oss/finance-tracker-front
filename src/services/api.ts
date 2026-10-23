import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV
    ? 'http://localhost:8000'
    : 'https://finance-tracker-api-7d8o.onrender.com'
);

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@FinanceTracker:token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@FinanceTracker:token');
      window.dispatchEvent(new Event('finance-tracker:unauthorized'));
    }
    return Promise.reject(error);
  },
);

