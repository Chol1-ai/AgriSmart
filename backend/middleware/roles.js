const checkRole = (...allowedRoles) => (req, res, next) => {
  const user = req.user;
  if (!user || !allowedRoles.includes(user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = { checkRole };
