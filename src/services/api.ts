import axios from 'axios';

// Substitua pela URL real da sua API no Render (ex: https://finance-tracker-api.onrender.com)
const API_URL = 'https://finance-tracker-api-7d8o.onrender.com';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@FinanceTracker:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});