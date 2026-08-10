const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const { ROLE_EXPERT } = require('../utils/constants');
const { listSupportQueries, reviewSupportQuery, broadcastAlert, getExpertNotifications, markExpertNotificationsRead } = require('../controllers/expertDashboardController');
const { reviewQueryValidator, broadcastAlertValidator } = require('../validators/expertValidator');

router.use(auth, checkRole(ROLE_EXPERT, 'admin'));
router.get('/queries', listSupportQueries);
router.get('/notifications', getExpertNotifications);
router.post('/notifications/read', markExpertNotificationsRead);
router.post('/queries/:id/review', reviewQueryValidator, reviewSupportQuery);
router.post('/broadcast', broadcastAlertValidator, broadcastAlert);

module.exports = router;
