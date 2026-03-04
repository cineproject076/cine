const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// REGISTER USER
router.post('/register', authController.registerUser);

// LOGIN USER
router.post('/login', authController.loginUser);

module.exports = router;