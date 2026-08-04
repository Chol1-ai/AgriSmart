const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  region: { type: String, default: '' },
  category: { type: String, default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
