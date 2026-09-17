import { useAuth } from './useAuth';

/**
 * useRole — returns the current user's role string, or null if unauthenticated.
 * Usage: const role = useRole();  // 'student' | 'industry' | ...
 */
export function useRole() {
  const { user } = useAuth();
  return user?.role ?? null;
}