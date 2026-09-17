/**
 * storage.js — localStorage abstraction for auth state.
 * All raw localStorage access is centralised here so the rest
 * of the app never directly calls localStorage.*
 */

const TOKEN_KEY = 'token';
const USER_KEY  = 'user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const setUser  = (user)  => localStorage.setItem(USER_KEY, JSON.stringify(user));

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};