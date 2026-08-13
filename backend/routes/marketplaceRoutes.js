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
router.get('/orders', auth, listOrdersForUser);
router.get('/orders/:id', auth, getOrder);

// Admin order list
router.get('/admin/orders', auth, adminListOrders);

module.exports = router;
