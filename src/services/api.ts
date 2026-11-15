import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV
    ? 'http://localhost:8000'
    : 'https://finance-tracker-api-7d8o.onrender.com'
);

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
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

/** Extrai a mensagem de erro amigável de uma resposta da API. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg).filter(Boolean).join(' ') || fallback;
    }
  }
  return fallback;
}
