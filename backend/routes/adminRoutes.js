const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const { getAdminSummary, listUsers, listAlerts, createAlert } = require('../controllers/adminDashboardController');
const { ROLE_ADMIN } = require('../utils/constants');
const { createAlertValidator } = require('../validators/adminValidator');

router.use(auth, checkRole(ROLE_ADMIN));
router.get('/summary', getAdminSummary);
router.get('/users', listUsers);
router.get('/alerts', listAlerts);
router.post('/alerts', createAlertValidator, createAlert);

module.exports = router;
