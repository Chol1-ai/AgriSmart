const createAlertValidator = (req, res, next) => {
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: 'Alert title and message are required' });
  }
  next();
};

module.exports = { createAlertValidator };
