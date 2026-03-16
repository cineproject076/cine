const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// REGISTER USER
router.post('/register', authController.registerUser);

// LOGIN USER
router.post('/login', authController.loginUser);

// OTP VERIFICATION
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);

module.exports = router;