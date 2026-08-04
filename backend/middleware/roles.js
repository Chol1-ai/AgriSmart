const checkRole = (...allowedRoles) => (req, res, next) => {
  const user = req.user;
  const effectiveRoles = new Set([user?.role, user?.role === 'admin' ? 'expert' : null].filter(Boolean));

  if (!user || !allowedRoles.some((role) => effectiveRoles.has(role))) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = { checkRole };
