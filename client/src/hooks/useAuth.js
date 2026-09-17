import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth — consume AuthContext.
 * Throws if used outside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}