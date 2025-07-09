// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/register-admin', authController.registerAdmin); // New route for admin registration
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout); // Có thể bảo vệ logout bằng authenticateToken nếu muốn

// Routes for 2FA management (protected)
router.post('/enable-2fa', authenticateToken, authController.enable2FA);
router.post('/verify-2fa', authenticateToken, authController.verify2FA);

// Route to check current token
router.get('/check-token', authenticateToken, authController.checkToken);

// Example of a protected route
router.get('/profile', authenticateToken, (req, res) => {
  // req.user được gán từ middleware authenticateToken
  res.json({
    message: `Welcome user ${req.user.email}! This is your profile.`,
    user: req.user
  });
});

module.exports = router;