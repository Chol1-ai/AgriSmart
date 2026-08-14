const User = require('../models/User');

exports.leaderboard = async (req, res) => {
  try {
    const limit = Math.min(50, Number(req.query.limit || 10));
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.location) filter.location = req.query.location;
    if (req.query.minLevel) filter.level = { $gte: Number(req.query.minLevel) };
    const users = await User.find(filter).select('name xp level badges location role').sort({ xp: -1 }).limit(limit);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load leaderboard', error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name xp level badges');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load gamification data', error: error.message });
  }
};

exports.rewards = async (_req, res) => {
  try {
    const { listRewards } = require('../services/gamificationService');
    res.json({ rewards: listRewards() });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load rewards', error: error.message });
  }
};

exports.redeem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rewardId } = req.body;
    const { redeemReward } = require('../services/gamificationService');
    const result = await redeemReward(userId, rewardId);
    res.json({ message: 'Reward redeemed', reward: result.reward, user: result.user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
