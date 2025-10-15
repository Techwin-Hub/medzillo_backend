const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Health Check
router.get('/health', authController.healthCheck);

// Registration flow
router.post('/register', authController.sendRegistrationOtp);
router.post('/verify-otp', authController.verifyOtpAndRegister);

// Login
router.post('/login', authController.loginUser);

// Password Reset Flow
router.post('/forgot-password/send-otp', authController.sendPasswordResetOtp);
router.post('/forgot-password/verify-otp', authController.verifyPasswordResetOtp);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
