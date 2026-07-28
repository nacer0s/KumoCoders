/**
 * Role-based access control middleware.
 * @param  {...string} allowedRoles - Role names permitted to access the route.
 * @returns {Function} Express middleware
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Map role IDs to names
    const roleMap = { 1: 'admin', 2: 'community' };
    const userRole = roleMap[req.user.role] || 'community';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
