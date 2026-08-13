const express = require('express');
const router = express.Router();
const { leaderboard } = require('../controllers/gamificationController');

router.get('/leaderboard', leaderboard);

module.exports = router;
