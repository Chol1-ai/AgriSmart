const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmName: { type: String, required: true },
  location: { type: String, default: '' },
  crops: [{ type: String }],
  livestock: [{ type: String }],
  ponds: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Farm', farmSchema);
