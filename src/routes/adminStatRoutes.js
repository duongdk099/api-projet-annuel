const express = require('express');
const router = express.Router();
const adminStatController = require('../controllers/adminStatController');
const authenticateToken = require('../../middleware/authMiddleware');
const authorizeAdmin = require('../../middleware/adminMiddleware');

// Admin routes protected by authentication and admin authorization
router.use(authenticateToken, authorizeAdmin);

// CRUD for stats by admin
router.get('/', adminStatController.getAllStats);
router.get('/:bookId', adminStatController.getStatsByBookId);
router.post('/', adminStatController.createStats);
router.put('/:bookId', adminStatController.updateStats);
router.delete('/:bookId', adminStatController.deleteStats);

module.exports = router;
