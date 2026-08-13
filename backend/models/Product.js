const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'other' },
  price: { type: Number, required: true },
  quantity: { type: String, default: '' },
  location: { type: String, default: '' },
  description: { type: String, default: '' },
  images: { type: [String], default: [] },
  status: { type: String, enum: ['active','pending','sold','archived'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
});

module.exports = mongoose.model('Product', productSchema);
