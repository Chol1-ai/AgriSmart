const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../validators/authValidator');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;
