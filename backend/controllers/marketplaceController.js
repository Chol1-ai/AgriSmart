const Product = require('../models/Product');
const Order = require('../models/Order');

exports.listProducts = async (req, res) => {
  try {
    const { category, status, q } = req.query;
    const filter = { deleted: false };
    if (category && category !== 'all') filter.category = category;
    if (status && status !== 'all') filter.status = status;
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }, { location: new RegExp(q, 'i') }];
    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Unable to list products', error: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.deleted) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load product', error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const payload = { ...req.body, seller: req.user._id };
    const product = await Product.create(payload);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create product', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.deleted) return res.status(404).json({ message: 'Product not found' });
    if (String(product.seller) !== String(req.user._id) && !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized to modify this product' });
    }
    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update product', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.deleted) return res.status(404).json({ message: 'Product not found' });
    if (String(product.seller) !== String(req.user._id) && !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }
    product.deleted = true;
    product.deletedAt = new Date();
    await product.save();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete product', error: error.message });
  }
};

// Create a simple order (no payment integration). Items should include productId and quantity.
exports.createOrder = async (req, res) => {
  try {
    const { items = [], deliveryAddress = '' } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Order must contain items' });
    // load products to compute total and snapshot price/name
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, deleted: false });
    const productsById = products.reduce((acc, p) => { acc[String(p._id)] = p; return acc; }, {});
    const orderItems = items.map((it) => {
      const p = productsById[String(it.productId)];
      if (!p) throw new Error('Product not found: ' + it.productId);
      return { productId: p._id, name: p.name, price: p.price, quantity: Number(it.quantity || 1) };
    });
    const total = orderItems.reduce((sum, it) => sum + (it.price * (it.quantity || 1)), 0);
    const order = await Order.create({ buyer: req.user._id, items: orderItems, total, deliveryAddress });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create order', error: error.message });
  }
};

// Simulate payment for an order (no external payment integration)
exports.payOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.buyer) !== String(req.user._id) && !req.user.roles.includes('admin')) return res.status(403).json({ message: 'Not authorized' });
    if (order.status !== 'placed') return res.status(400).json({ message: 'Order already processed' });
    order.status = 'confirmed';
    await order.save();
    res.json({ message: 'Payment confirmed', order });
  } catch (error) {
    res.status(500).json({ message: 'Payment failed', error: error.message });
  }
};

// Assign a delivery agent to an order (admin or seller)
exports.assignDeliveryAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // validate agent exists and has delivery role
    const User = require('../models/User');
    const agent = await User.findOne({ _id: agentId, $or: [{ role: 'delivery' }, { roles: 'delivery' }] });
    if (!agent) return res.status(400).json({ message: 'Agent not found or not a delivery agent' });
    order.deliveryAgent = { id: agent._id, name: agent.name, phone: agent.phone };
    order.status = 'assigned';
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Unable to assign delivery agent', error: error.message });
  }
};

// Update order status (delivery agent or admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['confirmed','picked','in_transit','delivered','cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // deliveryAgent or admin can update
    if (!req.user.roles.includes('admin') && String(order.deliveryAgent || '') !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to update status' });
    }
    order.status = status;
    await order.save();
    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update status', error: error.message });
  }
};

exports.listOrdersForUser = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Unable to list orders', error: error.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.buyer) !== String(req.user._id) && !req.user.roles.includes('admin')) return res.status(403).json({ message: 'Access denied' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load order', error: error.message });
  }
};

exports.adminListOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load orders', error: error.message });
  }
};
