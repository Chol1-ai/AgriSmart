const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Farm = require('../models/Farm');
const { JWT_SECRET } = require('../config/environment');

const generateToken = (user) => jwt.sign({ id: user._id, role: user.role, roles: user.roles || [] }, JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, location, farmName } = req.body;

    const existingUser = await User.findOne({ email: (email || '').toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email: (email || '').toLowerCase(),
      password,
      role: 'farmer',
      phone,
      location,
      farmName
    });

    if (farmName) {
      await Farm.create({ userId: user._id, farmName, location });
    }

    res.status(201).json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, roles: user.roles || [], phone: user.phone, location: user.location, farmName: user.farmName, xp: user.xp || 0, level: user.level || 1, badges: user.badges || [] }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, roles: user.roles || [], phone: user.phone, location: user.location, farmName: user.farmName, xp: user.xp || 0, level: user.level || 1, badges: user.badges || [] }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const farm = await Farm.findOne({ userId: req.user._id });
    res.json({ user: req.user, farm });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, location, farmName } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, location, farmName },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (farmName || location) {
      await Farm.findOneAndUpdate(
        { userId: req.user._id },
        { farmName: farmName || req.user.farmName, location: location || req.user.location },
        { upsert: true }
      );
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};
