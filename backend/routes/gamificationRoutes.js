const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { leaderboard, me, rewards, redeem } = require('../controllers/gamificationController');

router.get('/leaderboard', leaderboard);
router.get('/me', auth, me);
router.get('/rewards', rewards);
router.post('/redeem', auth, redeem);

module.exports = router;
