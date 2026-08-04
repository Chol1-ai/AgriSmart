const mongoose = require('mongoose');

const livestockSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
  category: { type: String, required: true },
  breed: { type: String, default: '' },
  count: { type: Number, default: 0 },
  healthRecords: [{
    date: { type: Date, default: Date.now },
    notes: String,
    treatment: String,
    vaccinated: Boolean
  }],
  productionData: [{
    date: { type: Date, default: Date.now },
    metric: String,
    value: Number,
    notes: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Livestock', livestockSchema);
