const User = require('../models/User');

const BADGES = [
  'First Harvest',
  'Master Planter',
  'Water Saver',
  'Pest Detective',
  'Smart Farmer',
  'Top Producer'
];

const xpToLevel = (xp) => Math.max(1, Math.floor(xp / 100) + 1);

const awardXp = async (userId, amount = 0) => {
  if (!userId) throw new Error('userId required');
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  user.xp = Number(user.xp || 0) + Number(amount || 0);
  user.level = xpToLevel(user.xp);
  await user.save();
  const u = user.toObject(); delete u.password;
  return u;
};

const addBadge = async (userId, badge) => {
  if (!userId || !badge) throw new Error('userId and badge required');
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  user.badges = Array.from(new Set([...(user.badges || []), badge]));
  await user.save();
  const u = user.toObject(); delete u.password;
  return u;
};

const removeBadge = async (userId, badge) => {
  if (!userId || !badge) throw new Error('userId and badge required');
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  user.badges = (user.badges || []).filter((b) => b !== badge);
  await user.save();
  const u = user.toObject(); delete u.password;
  return u;
};

const setRoles = async (userId, roles = []) => {
  if (!userId) throw new Error('userId required');
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  user.roles = Array.isArray(roles) ? roles : [roles];
  await user.save();
  const u = user.toObject(); delete u.password;
  return u;
};

const listBadges = () => BADGES.slice();

module.exports = { awardXp, addBadge, removeBadge, setRoles, listBadges };
