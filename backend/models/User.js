const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  // Primary legacy role (kept for compatibility). New multi-role support uses `roles`.
  role: { type: String, enum: ['farmer', 'expert', 'admin'], default: 'farmer' },
  // Support multiple roles per user (e.g. farmer + cooperative manager)
  roles: { type: [String], enum: ['farmer','farm_worker','expert','buyer','supplier','transporter','cooperative_manager','financial_partner','agriculture_officer','admin','platform_admin'], default: ['farmer'] },
  // Gamification fields
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: { type: [String], default: [] },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  farmName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
