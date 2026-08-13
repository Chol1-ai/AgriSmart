const checkRole = (...allowedRoles) => (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'Authentication required' });

  // Collect roles from new `roles` array and legacy `role` string
  const userRoles = new Set([...(user.roles || []), user.role].filter(Boolean));

  // Platform admins have implicit access to everything
  if (userRoles.has('admin') || userRoles.has('platform_admin')) return next();

  if (!allowedRoles.some((role) => userRoles.has(role))) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = { checkRole };
