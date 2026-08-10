const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const { getAdminSummary, listUsers, createUser, deleteUser, listAlerts, createAlert, listSupportQueries, reviewSupportQuery, getAdminNotifications, markAdminNotificationsRead } = require('../controllers/adminDashboardController');
const { ROLE_ADMIN } = require('../utils/constants');
const { createAlertValidator, createUserValidator } = require('../validators/adminValidator');

router.use(auth, checkRole(ROLE_ADMIN));
router.get('/summary', getAdminSummary);
router.get('/users', listUsers);
router.post('/users', createUserValidator, createUser);
router.delete('/users/:id', deleteUser);
router.get('/alerts', listAlerts);
router.get('/support', listSupportQueries);
router.post('/support/:id/review', reviewSupportQuery);
router.get('/notifications', getAdminNotifications);
router.post('/notifications/read', markAdminNotificationsRead);
router.post('/alerts', createAlertValidator, createAlert);
// Administrative maintenance: purge soft-deleted records older than N days
router.post('/cleanup-deleted', require('../controllers/adminDashboardController').purgeDeleted);
// Restore a soft-deleted record: type = crop|livestock|pond
router.post('/restore/:type/:id', require('../controllers/adminDashboardController').restoreDeleted);

module.exports = router;
