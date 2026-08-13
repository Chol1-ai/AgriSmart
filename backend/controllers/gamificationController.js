const User = require('../models/User');

exports.leaderboard = async (req, res) => {
  try {
    const limit = Math.min(50, Number(req.query.limit || 10));
    const users = await User.find().select('name xp level badges location').sort({ xp: -1 }).limit(limit);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load leaderboard', error: error.message });
  }
};
