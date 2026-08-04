const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/farmer', require('./farmerRoutes'));
router.use('/expert', require('./expertRoutes'));
router.use('/admin', require('./adminRoutes'));

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'agrismart-backend' });
});

module.exports = router;
