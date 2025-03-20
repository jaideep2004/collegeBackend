const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  forgotPassword, 
  validateResetToken, 
  resetPassword 
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/validate-reset-token', validateResetToken);
router.post('/reset-password', resetPassword);

module.exports = router;