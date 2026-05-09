/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearStoredAuth, ROLE_KEY, TOKEN_KEY, USER_KEY } from '../api/axios';
import { dashboardPathFor, isDeveloperEnabled, isKnownRole } from '../utils/rbac';

const AuthContext = createContext(null);

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

function normalizeUser(payload) {
  const raw = payload?.data ?? payload;
  const user = raw?.user ?? raw;
  const role = raw?.role ?? user?.role;

  return { user, role };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem('token'));
  const [user, setUser] = useState(() => readJson(USER_KEY) ?? readJson('auth_user'));
  const [role, setRole] = useState(() => localStorage.getItem(ROLE_KEY) ?? localStorage.getItem('user_role'));
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (role && !isKnownRole(role)) {
        clearStoredAuth();
        if (!cancelled) {
          setToken(null);
          setUser(null);
          setRole(null);
          setBooting(false);
        }
        return;
      }

      if (role && !isDeveloperEnabled(role)) {
        clearStoredAuth();
        if (!cancelled) {
          setToken(null);
          setUser(null);
          setRole(null);
          setBooting(false);
        }
        return;
      }

      if (token && role) {
        try {
          const response = await api.get('/me');
          const normalized = normalizeUser(response.data);

          if (!normalized.role || !isDeveloperEnabled(normalized.role)) {
            throw new Error('Authenticated role is not valid.');
          }

          if (!cancelled) {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(normalized.user));
            localStorage.setItem(ROLE_KEY, normalized.role);
            setUser(normalized.user);
            setRole(normalized.role);
            setBooting(false);
          }
        } catch {
          clearStoredAuth();
          if (!cancelled) {
            setToken(null);
            setUser(null);
            setRole(null);
            setBooting(false);
          }
        }
        return;
      }

      clearStoredAuth();
      if (!cancelled) {
        setToken(null);
        setUser(null);
        setRole(null);
        setBooting(false);
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, [token, role]);

  useEffect(() => {
    function expire() {
      clearStoredAuth();
      setToken(null);
      setUser(null);
      setRole(null);
    }

    window.addEventListener('auth:expired', expire);
    return () => window.removeEventListener('auth:expired', expire);
  }, []);

  const login = useCallback(async ({ identifiant, password }) => {
    const response = await api.post('/login', {
      identifiant,
      password,
      device_name: 'react-web',
    });
    const authToken = response.data.token;
    const normalized = normalizeUser(response.data);

    if (!normalized.role || !isDeveloperEnabled(normalized.role)) {
      clearStoredAuth();
      throw new Error('This role is no longer valid. Please contact the administrator.');
    }

    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized.user));
    localStorage.setItem(ROLE_KEY, normalized.role);

    setToken(authToken);
    setUser(normalized.user);
    setRole(normalized.role);

    return dashboardPathFor(normalized.role);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) await api.post('/logout');
    } catch {
      // Logout should clear the browser session even if the token is already invalid.
    } finally {
      clearStoredAuth();
      setToken(null);
      setUser(null);
      setRole(null);
    }
  }, [token]);

  const value = useMemo(() => ({
    booting,
    isAuthenticated: Boolean(token && role),
    login,
    logout,
    role,
    token,
    user,
  }), [booting, login, logout, role, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
