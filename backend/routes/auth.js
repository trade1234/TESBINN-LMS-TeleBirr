const express = require('express');

const {
  register,
  login,
  getMe,
  updateDetails,
  updateSettings,
  updatePassword,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { limitRegistrationAttempts, limitLoginAttemptsByIp } = require('../middleware/authAbuseProtection');
const { registerValidationRules, loginValidationRules } = require('../middleware/authInputValidation');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

router.post('/register', limitRegistrationAttempts, registerValidationRules, validateRequest, register);
router.post('/login', limitLoginAttemptsByIp, loginValidationRules, validateRequest, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/settings', protect, updateSettings);
router.put('/updatepassword', protect, updatePassword);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
