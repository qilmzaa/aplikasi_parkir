import axios from 'axios';

const TOKEN_KEY = 'parkir_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = String(error.config?.url || '').includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('parkir_user');
      window.dispatchEvent(new Event('parkir:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export const TOKEN_STORAGE_KEY = TOKEN_KEY;

/** Mengambil pesan error API yang ramah untuk toast. */
export function getErrorMessage(error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  if (error?.code === 'ERR_CANCELED') return '';
  return error?.response?.data?.message || error?.message || fallback;
}

/** Membaca nama file dari header Content-Disposition. */
export function getFileName(disposition, fallback) {
  if (!disposition) return fallback;
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1] || fallback;
}

export default api;
