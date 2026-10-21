import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_STORAGE_KEY } from '../lib/api';

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'parkir_user';

export const ROLE_HOME = {
  admin: '/admin',
  petugas: '/petugas',
  owner: '/owner',
};

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (
    localStorage.getItem(TOKEN_STORAGE_KEY) ? readStoredUser() : null
  ));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  const persistAuth = useCallback((token, nextUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const clearAuth = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    api.get('/auth/me')
      .then((response) => {
        if (!active) return;
        const currentUser = response.data.data;
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch(() => {
        if (active) clearAuth();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clearAuth]);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('parkir:unauthorized', onUnauthorized);
    return () => window.removeEventListener('parkir:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user: loggedUser } = response.data.data;
    persistAuth(token, loggedUser);
    return loggedUser;
  }, [persistAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Token mungkin sudah kedaluwarsa; sesi lokal tetap dibersihkan.
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    clearAuth,
    homePath: user ? ROLE_HOME[user.role] || '/' : '/login',
  }), [user, loading, login, logout, clearAuth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return context;
}
