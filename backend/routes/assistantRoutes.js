const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { chat } = require('../controllers/assistantController');

// simple authenticated assistant endpoint
router.post('/assistant', auth, chat);

module.exports = router;
