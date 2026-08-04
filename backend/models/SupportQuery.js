const mongoose = require('mongoose');

const supportQuerySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, default: 'general' },
  subject: { type: String, required: true },
  details: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  assignedExpert: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  response: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportQuery', supportQuerySchema);
