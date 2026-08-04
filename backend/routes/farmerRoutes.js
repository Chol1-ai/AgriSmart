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
  createFinanceRecord,
  submitSupportQuery,
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
  createFinanceValidator,
  supportQueryValidator,
  diagnosisValidator,
  communityPostValidator
} = require('../validators/farmerValidator');

router.use(auth, checkRole(ROLE_FARMER, ROLE_EXPERT, ROLE_ADMIN));
router.get('/dashboard', getFarmerDashboard);
router.get('/alerts', listAlerts);
router.post('/crops', createCropValidator, createCrop);
router.post('/livestock', createLivestockValidator, createLivestock);
router.post('/ponds', createPondValidator, createPond);
router.post('/finance', createFinanceValidator, createFinanceRecord);
router.post('/support', supportQueryValidator, submitSupportQuery);
router.post('/diagnose', diagnosisValidator, diagnoseLeaf);
router.post('/sync', enqueueOfflineSync);
router.get('/sync', listOfflineSync);
router.post('/sync/resolve', resolveOfflineSync);
router.get('/reports', getReport);
router.get('/community', listCommunityPosts);
router.post('/community', communityPostValidator, createCommunityPost);

module.exports = router;
