/**
 * requireRole.js
 *
 * Role-Based Access Control (RBAC) middleware for CareerOdyssey.
 * Supports canonical primary roles: STUDENT, ACADEMIA, INDUSTRY, ADMIN
 * and preserves 100% backward compatibility with existing role tokens
 * ('academician', 'institution_admin', 'institution', 'super_admin').
 */

const ALLOWED_FOR_ROLE_REQUIREMENT = {
  academia: ['academia', 'academician', 'institution_admin', 'institution'],
  academician: ['academician', 'academia'],
  institution_admin: ['institution_admin', 'institution', 'admin'],
  institution: ['institution_admin', 'institution', 'admin'],
  admin: ['admin', 'super_admin', 'institution_admin'],
  super_admin: ['admin', 'super_admin'],
  student: ['student'],
  industry: ['industry'],
};

const normalizeRole = (role) => {
  if (!role) return '';
  return String(role).toLowerCase().trim();
};

const requireRole = (...roles) => {
  // Flatten in case an array was passed as first argument
  const requiredRoles = roles.flat().map(normalizeRole);
  // Expand allowed user roles based on the requirement
  const allowedRoles = new Set();
  requiredRoles.forEach((reqRole) => {
    allowedRoles.add(reqRole);
    const allowed = ALLOWED_FOR_ROLE_REQUIREMENT[reqRole];
    if (allowed) {
      allowed.forEach((r) => allowedRoles.add(r));
    }
  });

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRole = normalizeRole(req.user.role);

    // Super Admin / Admin has universal administrative access
    if (userRole === 'super_admin' || userRole === 'admin') {
      return next();
    }

    if (!allowedRoles.has(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${Array.from(allowedRoles).join(', ')}]. Current role: ${userRole}`,
      });
    }

    next();
  };
};

module.exports = requireRole;