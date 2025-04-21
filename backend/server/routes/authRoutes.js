// server/routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const { register, verifyOtp, login, getProfile } = require('../controllers/authController');
// now this matches:
const { authenticateJWT } = require('../middleware/authMiddleware');

// Public
router.post('/register',    register);
router.post('/verify-otp',  verifyOtp);
router.post('/login',       login);

// Protected
router.get('/profile', authenticateJWT, getProfile);

module.exports = router;
