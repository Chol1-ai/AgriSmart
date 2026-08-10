const User = require('../models/User');
const Alert = require('../models/Alert');
const SupportQuery = require('../models/SupportQuery');

exports.getAdminSummary = async (_req, res) => {
  try {
    const userCount = await User.countDocuments();
    const alertCount = await Alert.countDocuments();
    const supportCount = await SupportQuery.countDocuments({ status: 'pending' });
    res.json({ userCount, alertCount, supportCount, serviceStatus: 'healthy' });
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

exports.listSupportQueries = async (_req, res) => {
  try {
    const queries = await SupportQuery.find({ status: 'pending' }).populate('userId', 'name email');
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load support queries', error: error.message });
  }
};

exports.reviewSupportQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, status = 'reviewed' } = req.body;
    const query = await SupportQuery.findByIdAndUpdate(
      id,
      { response, status, viewedByStaff: true, viewedByRequester: false },
      { new: true }
    );
    if (!query) return res.status(404).json({ message: 'Support query not found' });
    res.json(query);
  } catch (error) {
    res.status(500).json({ message: 'Unable to review support query', error: error.message });
  }
};

exports.getAdminNotifications = async (_req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(10);
    const supportQueries = await SupportQuery.find({ status: 'pending', viewedByStaff: false })
      .populate('userId', 'name email');
    res.json({ alerts, supportQueries });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load notifications', error: error.message });
  }
};

exports.markAdminNotificationsRead = async (_req, res) => {
  try {
    await SupportQuery.updateMany({ status: 'pending', viewedByStaff: false }, { viewedByStaff: true });
    res.json({ message: 'Notifications marked read' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to mark notifications read', error: error.message });
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

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, location, farmName } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, role, phone, location, farmName });
    const userData = user.toObject();
    delete userData.password;
    res.status(201).json(userData);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create user', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete user', error: error.message });
  }
};
