const express = require('express');
const router = express.Router();
const statController = require('../controllers/statController');
const authenticateToken = require('../../middleware/authMiddleware');

// All routes protected by JWT auth
router.use(authenticateToken);

// GET /api/stats - All stats
router.get('/', statController.getAllStats);

// GET /api/stats/:bookId - Get stats for a book
router.get('/:bookId', statController.getStatsByBookId);

// POST /api/stats - Create stats
router.post('/', statController.createStats);

// PUT /api/stats/:bookId - Update stats
router.put('/:bookId', statController.updateStats);

// DELETE /api/stats/:bookId - Delete stats
router.delete('/:bookId', statController.deleteStats);

module.exports = router;
