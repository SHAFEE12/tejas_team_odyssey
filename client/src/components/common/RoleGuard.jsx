import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES, ROLES } from '../../utils/constants';

/**
 * RoleGuard — ensures the authenticated user has the expected role(s).
 * Supports single allowedRole or array of allowedRoles.
 * If the role doesn't match, redirects to /login rather than exposing
 * any unauthorized dashboard content.
 */
export default function RoleGuard({ allowedRole, allowedRoles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const expected = allowedRoles
    ? (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles])
    : (allowedRole ? [allowedRole] : []);

  // Normalize legacy 'institution' role to match 'institution_admin'
  const userRole = user.role === ROLES.INSTITUTION ? ROLES.INSTITUTION_ADMIN : user.role;
  const normalizedExpected = expected.map(r => r === ROLES.INSTITUTION ? ROLES.INSTITUTION_ADMIN : r);

  if (user.role !== ROLES.SUPER_ADMIN && !normalizedExpected.includes(userRole) && !expected.includes(user.role)) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return children;
}