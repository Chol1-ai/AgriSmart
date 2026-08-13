const User = require('../models/User');
const Alert = require('../models/Alert');
const SupportQuery = require('../models/SupportQuery');
const Crop = require('../models/Crop');
const Livestock = require('../models/Livestock');
const Pond = require('../models/Pond');
const Audit = require('../models/AuditLog');
const { awardXp, addBadge, removeBadge, setRoles, listBadges } = require('../services/gamificationService');

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
    const { response, status = 'reviewed', expertName = '', expertLocation = '' } = req.body;
    const query = await SupportQuery.findByIdAndUpdate(
      id,
      { response, status, expertName, expertLocation, viewedByStaff: true, viewedByRequester: false },
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

// Purge soft-deleted records older than `days` (default 30). Returns counts.
exports.purgeDeleted = async (req, res) => {
  try {
    const days = Number(req.query.days || req.body.days || 30);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const cropRes = await Crop.deleteMany({ deleted: true, deletedAt: { $lt: cutoff } });
    const livestockRes = await Livestock.deleteMany({ deleted: true, deletedAt: { $lt: cutoff } });
    const pondRes = await Pond.deleteMany({ deleted: true, deletedAt: { $lt: cutoff } });
    await Audit.create({ action: 'purge-deleted', userId: req.user._id, metadata: { days, cropCount: cropRes.deletedCount, livestockCount: livestockRes.deletedCount, pondCount: pondRes.deletedCount } });
    res.json({ message: 'Purge completed', counts: { crops: cropRes.deletedCount, livestock: livestockRes.deletedCount, ponds: pondRes.deletedCount } });
  } catch (error) {
    res.status(500).json({ message: 'Unable to purge deleted records', error: error.message });
  }
};

// Restore a soft-deleted record by type and id
exports.restoreDeleted = async (req, res) => {
  try {
    const { type, id } = req.params;
    let model;
    if (type === 'crop') model = Crop;
    else if (type === 'livestock') model = Livestock;
    else if (type === 'pond') model = Pond;
    else return res.status(400).json({ message: 'Invalid type' });
    const doc = await model.findOneAndUpdate({ _id: id, deleted: true }, { $set: { deleted: false, deletedAt: null } }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Record not found or not deleted' });
    await Audit.create({ action: 'restore', userId: req.user._id, targetType: type, targetId: doc._id });
    res.json({ message: 'Record restored', record: doc });
  } catch (error) {
    res.status(500).json({ message: 'Unable to restore record', error: error.message });
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

// Administrative role management: replace roles array for a user
exports.setUserRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const { roles } = req.body;
    const user = await setRoles(id, roles);
    await Audit.create({ action: 'set-roles', userId: req.user._id, targetId: id, metadata: { roles } });
    res.json({ message: 'Roles updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update roles', error: error.message });
  }
};

// Award XP to a user (admin action or system webhook)
exports.awardXpToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount = 0 } = req.body;
    const user = await awardXp(id, Number(amount));
    await Audit.create({ action: 'award-xp', userId: req.user._id, targetId: id, metadata: { amount } });
    res.json({ message: 'XP awarded', user });
  } catch (error) {
    res.status(500).json({ message: 'Unable to award XP', error: error.message });
  }
};

exports.addBadgeToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { badge } = req.body;
    const user = await addBadge(id, badge);
    await Audit.create({ action: 'add-badge', userId: req.user._id, targetId: id, metadata: { badge } });
    res.json({ message: 'Badge added', user });
  } catch (error) {
    res.status(500).json({ message: 'Unable to add badge', error: error.message });
  }
};

exports.removeBadgeFromUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { badge } = req.body;
    const user = await removeBadge(id, badge);
    await Audit.create({ action: 'remove-badge', userId: req.user._id, targetId: id, metadata: { badge } });
    res.json({ message: 'Badge removed', user });
  } catch (error) {
    res.status(500).json({ message: 'Unable to remove badge', error: error.message });
  }
};

exports.listAvailableBadges = async (_req, res) => {
  try {
    res.json({ badges: listBadges() });
  } catch (error) {
    res.status(500).json({ message: 'Unable to list badges', error: error.message });
  }
};
