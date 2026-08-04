const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  entityType: { type: String, enum: ['crop', 'livestock', 'pond'], required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  treatment: { type: String, default: '' },
  severity: { type: String, enum: ['Mild', 'Moderate', 'Critical'], default: 'Mild' }
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
