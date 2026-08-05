const mongoose = require('mongoose');
const {
  MONGODB_URI,
  LOCAL_MONGODB_URI,
  NODE_ENV,
  DEFAULT_ADMIN_NAME,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD
} = require('./environment');
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

const connectToUri = async (uri) => {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: true
  });
};

const connectDatabase = async () => {
  const triedUris = [];
  try {
    triedUris.push(MONGODB_URI);
    await connectToUri(MONGODB_URI);
    console.log(`MongoDB connected to ${MONGODB_URI}`);
  } catch (error) {
    console.error('MongoDB connection failed for configured URI:', error.message);
    if (LOCAL_MONGODB_URI && LOCAL_MONGODB_URI !== MONGODB_URI) {
      try {
        await mongoose.disconnect();
      } catch (_) {}
      try {
        triedUris.push(LOCAL_MONGODB_URI);
        await connectToUri(LOCAL_MONGODB_URI);
        console.log(`MongoDB connected to local fallback ${LOCAL_MONGODB_URI}`);
      } catch (fallbackError) {
        console.error('Local MongoDB fallback failed:', fallbackError.message);
        console.error('Tried URIs:', triedUris.join(', '));
        process.exit(1);
      }
    } else {
      console.error('No local MongoDB fallback configured or it is the same as the main URI.');
      console.error('Tried URIs:', triedUris.join(', '));
      process.exit(1);
    }
  }

  if (NODE_ENV !== 'test') {
    await createDefaultAdmin();
  }
};

module.exports = connectDatabase;
