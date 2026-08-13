const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { listProducts, getProduct, createProduct, updateProduct, deleteProduct, createOrder, listOrdersForUser, getOrder, adminListOrders } = require('../controllers/marketplaceController');

// Public listing
router.get('/products', listProducts);
router.get('/products/:id', getProduct);

// Auth required for create/update/delete
router.post('/products', auth, createProduct);
router.put('/products/:id', auth, updateProduct);
router.delete('/products/:id', auth, deleteProduct);

// Orders
router.post('/orders', auth, createOrder);
router.post('/orders/:id/pay', auth, require('../controllers/marketplaceController').payOrder);
router.post('/orders/:id/assign', auth, require('../controllers/marketplaceController').assignDeliveryAgent);
router.post('/orders/:id/status', auth, require('../controllers/marketplaceController').updateOrderStatus);
router.get('/orders', auth, listOrdersForUser);
router.get('/orders/:id', auth, getOrder);

// Seller-specific
router.get('/seller/products', auth, require('../controllers/marketplaceController').listSellerProducts);
router.get('/seller/orders', auth, require('../controllers/marketplaceController').listSellerOrders);

// Admin order list
// Admin-only orders listing
router.get('/admin/orders', auth, require('../middleware/roles').checkRole('admin'), adminListOrders);

module.exports = router;
