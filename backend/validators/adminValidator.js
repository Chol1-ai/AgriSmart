const createAlertValidator = (req, res, next) => {
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: 'Alert title and message are required' });
  }
  next();
};

const createUserValidator = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const allowedRoles = ['farmer', 'expert', 'admin'];
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password and role are required' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ message: 'Valid email is required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role selected' });
  }
  next();
};

const setRolesValidator = (req, res, next) => {
  const { roles } = req.body;
  if (!roles || !Array.isArray(roles)) return res.status(400).json({ message: 'Roles must be an array' });
  // allow broader set managed by User schema enum
  next();
};

module.exports = { createAlertValidator, createUserValidator, setRolesValidator };
