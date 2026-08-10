const mongoose = require('mongoose');

const pondSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pondName: { type: String, required: true },
  pondType: { type: String, enum: ['earthen', 'concrete', 'ras', 'floating cage'], default: 'earthen' },
  species: { type: String, default: '' },
  stockingDensity: { type: Number, default: 0 },
  batchAgeDays: { type: Number, default: 0 },
  fingerlingCount: { type: Number, default: 0 },
  waterQualityRecords: [{
    date: { type: Date, default: Date.now },
    pH: Number,
    temperature: Number,
    dissolvedOxygen: Number,
    TAN: Number,
    turbidity: Number,
    notes: String
  }],
  feedRecords: [{
    date: { type: Date, default: Date.now },
    feedType: String,
    amountKg: Number,
    notes: String
  }],
  harvestForecast: {
    targetDate: Date,
    expectedWeightKg: Number,
    notes: String
  },
  createdAt: { type: Date, default: Date.now }
  ,
  deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Pond', pondSchema);
