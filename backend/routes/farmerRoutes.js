const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const { ROLE_FARMER, ROLE_EXPERT, ROLE_ADMIN } = require('../utils/constants');
const {
  getFarmerDashboard,
  listAlerts,
  createCrop,
  createLivestock,
  createPond,
  listPonds,
  addWaterQualityRecord,
  addFeedRecord,
  createFinanceRecord,
  submitSupportQuery,
  listFarmerSupportQueries,
  getFarmerNotifications,
  markFarmerNotificationsRead,
  diagnoseLeaf,
  enqueueOfflineSync,
  resolveOfflineSync,
  listOfflineSync,
  getReport,
  listCommunityPosts,
  createCommunityPost
} = require('../controllers/farmerDashboardController');
const {
  createCropValidator,
  createLivestockValidator,
  createPondValidator,
  createWaterQualityValidator,
  createFeedRecordValidator,
  createFinanceValidator,
  supportQueryValidator,
  diagnosisValidator,
  communityPostValidator
} = require('../validators/farmerValidator');

router.use(auth, checkRole(ROLE_FARMER, ROLE_EXPERT, ROLE_ADMIN));
router.get('/dashboard', getFarmerDashboard);
router.get('/ponds', listPonds);
router.get('/alerts', listAlerts);
router.post('/crops', createCropValidator, createCrop);
router.post('/livestock', createLivestockValidator, createLivestock);
router.post('/ponds', createPondValidator, createPond);
router.put('/crops/:id', createCropValidator, require('../controllers/farmerDashboardController').updateCrop);
router.delete('/crops/:id', require('../controllers/farmerDashboardController').deleteCrop);
router.put('/livestock/:id', createLivestockValidator, require('../controllers/farmerDashboardController').updateLivestock);
router.delete('/livestock/:id', require('../controllers/farmerDashboardController').deleteLivestock);
router.put('/ponds/:id', createPondValidator, require('../controllers/farmerDashboardController').updatePond);
router.delete('/ponds/:id', require('../controllers/farmerDashboardController').deletePond);
router.post('/ponds/:id/water-quality', createWaterQualityValidator, addWaterQualityRecord);
router.post('/ponds/:id/feed-record', createFeedRecordValidator, addFeedRecord);
router.post('/finance', createFinanceValidator, createFinanceRecord);
router.post('/support', supportQueryValidator, submitSupportQuery);
router.get('/support/queries', listFarmerSupportQueries);
router.get('/notifications', getFarmerNotifications);
router.post('/notifications/read', markFarmerNotificationsRead);
router.post('/diagnose', diagnosisValidator, diagnoseLeaf);
router.post('/sync', enqueueOfflineSync);
router.get('/sync', listOfflineSync);
router.post('/sync/resolve', resolveOfflineSync);
router.get('/reports', getReport);
router.get('/community', listCommunityPosts);
router.post('/community', communityPostValidator, createCommunityPost);

module.exports = router;
