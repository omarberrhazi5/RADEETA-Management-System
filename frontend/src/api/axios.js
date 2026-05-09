import axios from 'axios';
import { isKnownRole } from '../utils/rbac';

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

const legacyModulePatterns = [
  /\/(invoices|invoice|payments|payment|tariffs|tariff-settings)(\/|$|\?)/i,
  /\/(factures|facture|paiements|paiement)(\/|$|\?)/i,
  /\/reports\/(invoices|payments|factures|paiements)(\/|$|\?)/i,
];

function isLegacyModuleUrl(url = '') {
  return legacyModulePatterns.some((pattern) => pattern.test(url));
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const role = localStorage.getItem(ROLE_KEY) ?? localStorage.getItem('user_role');

  if (token && role && !isKnownRole(role)) {
    clearStoredAuth();
    window.dispatchEvent(new Event('auth:expired'));
    return Promise.reject(new axios.CanceledError('Stored role is no longer valid.'));
  }

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;

    if (error.response?.status === 404 && isLegacyModuleUrl(requestUrl)) {
      if (window.location.pathname.match(/\/(invoices|payments|tariffs|factures|paiements|tariff)/i)) {
        window.location.replace('/dashboard');
      }

      return Promise.resolve({
        data: { data: [], meta: { legacy_module_removed: true } },
        status: 204,
        statusText: 'Legacy module removed',
        headers: {},
        config: error.config,
      });
    }

    if (error.response?.status === 401) {
      clearStoredAuth();
      window.dispatchEvent(new Event('auth:expired'));
    }

    if (error.response?.status === 403) {
      window.dispatchEvent(new Event('auth:forbidden'));
    }

    return Promise.reject(error);
  },
);

export function clearStoredAuth() {
  localStorage.clear();
  sessionStorage.clear();

  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (!name) return;

    const expires = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = `${name}=; ${expires}; path=/`;
    document.cookie = `${name}=; ${expires}; path=/; domain=${window.location.hostname}`;
  });
}

export default api;
