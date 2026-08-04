const reviewQueryValidator = (req, res, next) => {
  const { response, status } = req.body;
  if (!response) {
    return res.status(400).json({ message: 'Response text is required' });
  }
  if (status && !['pending', 'reviewed', 'resolved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }
  next();
};

const broadcastAlertValidator = (req, res, next) => {
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: 'Alert title and message are required' });
  }
  next();
};

module.exports = { reviewQueryValidator, broadcastAlertValidator };
