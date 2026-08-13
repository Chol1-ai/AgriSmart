const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/farmer', require('./farmerRoutes'));
router.use('/expert', require('./expertRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/marketplace', require('./marketplaceRoutes'));
router.use('/academy', require('./academyRoutes'));
router.use('/gamification', require('./gamificationRoutes'));
router.use('/ai', require('./assistantRoutes'));

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'agrismart-backend' });
});

module.exports = router;
