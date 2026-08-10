const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
  cropType: { type: String, required: true },
  variety: { type: String, default: '' },
  plantingDate: { type: Date, default: Date.now },
  expectedHarvestDate: { type: Date },
  expectedYield: { type: Number, default: 0 },
  treatmentHistory: [{
    date: { type: Date, default: Date.now },
    action: String,
    notes: String
  }],
  diseaseHistory: [{
    diseaseName: String,
    severity: String,
    diagnosisDate: Date,
    treatment: String
  }],
  createdAt: { type: Date, default: Date.now }
  ,
  deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Crop', cropSchema);
