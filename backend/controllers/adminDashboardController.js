const User = require('../models/User');
const Alert = require('../models/Alert');

exports.getAdminSummary = async (_req, res) => {
  try {
    const userCount = await User.countDocuments();
    const alertCount = await Alert.countDocuments();
    res.json({ userCount, alertCount, serviceStatus: 'healthy' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load admin summary', error: error.message });
  }
};

exports.listUsers = async (_req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load users', error: error.message });
  }
};

exports.listAlerts = async (_req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(10);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load alerts', error: error.message });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const { title, message, region, category, priority } = req.body;
    const alert = await Alert.create({ title, message, region, category, priority, createdBy: req.user._id });
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create alert', error: error.message });
  }
};
