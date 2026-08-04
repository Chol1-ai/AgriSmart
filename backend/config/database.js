const mongoose = require('mongoose');
const { MONGODB_URI, NODE_ENV, DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } = require('./environment');
const User = require('../models/User');

const createDefaultAdmin = async () => {
  if (!DEFAULT_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) return;

  const email = DEFAULT_ADMIN_EMAIL.toLowerCase();
  const existingAdmin = await User.findOne({ email });

  if (existingAdmin) {
    const needsUpdate = existingAdmin.role !== 'admin' || existingAdmin.name !== DEFAULT_ADMIN_NAME;
    if (needsUpdate) {
      existingAdmin.name = DEFAULT_ADMIN_NAME;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
    }
    console.log(`Default admin already exists: ${email}`);
    return;
  }

  await User.create({
    name: DEFAULT_ADMIN_NAME,
    email,
    password: DEFAULT_ADMIN_PASSWORD,
    role: 'admin'
  });
  console.log(`Default admin created: ${email}`);
};

const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true
    });
    console.log(`MongoDB connected${NODE_ENV === 'development' ? '' : ''}`);

    if (NODE_ENV !== 'test') {
      await createDefaultAdmin();
    }
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;
