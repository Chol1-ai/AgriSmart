const mongoose = require('mongoose');

const financeRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enterpriseType: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
  expectedRevenue: { type: Number, default: 0 },
  actualRevenue: { type: Number, default: 0 },
  notes: { type: String, default: '' }
});

module.exports = mongoose.model('FinanceRecord', financeRecordSchema);
