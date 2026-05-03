import axios from 'axios';

export const TOKEN_KEY = 'srm_token';
export const USER_KEY = 'srm_user';
export const ROLE_KEY = 'srm_role';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ROLE_KEY);
      window.dispatchEvent(new Event('auth:expired'));
    }

    if (error.response?.status === 403) {
      window.dispatchEvent(new Event('auth:forbidden'));
    }

    return Promise.reject(error);
  },
);

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('user_role');
}

export default api;
