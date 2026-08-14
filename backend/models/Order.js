const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [orderItemSchema], default: [] },
  total: { type: Number, required: true },
  status: { type: String, enum: ['placed','confirmed','assigned','picked','in_transit','delivered','cancelled'], default: 'placed' },
  deliveryAddress: { type: String, default: '' },
  // store a snapshot of delivery agent details when assigned
  deliveryAgent: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    phone: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
