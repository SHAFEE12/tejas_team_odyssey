/**
 * AuthContext — global authentication state.
 *
 * Reads initial state from localStorage (written by Login.jsx on success).
 * Exposes: user, token, isAuthenticated, logout.
 * Syncs state across browser tabs via the 'storage' event.
 */

import { createContext, useState, useCallback, useEffect } from 'react';
import { getToken, getUser, clearAuth } from '../utils/storage';
import { API_URL } from '../utils/constants';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => getUser());
  const [token, setToken] = useState(() => getToken());

  const isAuthenticated = Boolean(token && user);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      const next = typeof userData === 'function' ? userData(prev) : { ...prev, ...userData };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  }, []);

  // Fetch current user from /api/auth/me to ensure freshness (e.g. registrationNumber, collegeName)
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401) {
          logout();
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then(data => {
        if (isMounted && data?.success && data?.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      })
      .catch(err => {
        console.error('Failed to sync auth user:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  // Keep context in sync when another tab logs in or out
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'token') {
        setToken(e.newValue);
      }
      if (e.key === 'user') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}