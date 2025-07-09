const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapterController');
const authenticateToken = require('../../middleware/authMiddleware');

// All routes protected by JWT auth
router.use(authenticateToken);

// GET /api/chapters - All chapters, optionally filtered by book_id
router.get('/', chapterController.getAllChapters);

// GET /api/chapters/:id - Get a chapter by ID
router.get('/:id', chapterController.getChapterById);

// GET /api/books/:bookId/chapters - All chapters for a book
router.get('/../books/:bookId/chapters', chapterController.getChaptersByBookId);

// POST /api/chapters - Create a chapter
router.post('/', chapterController.createChapter);

// PUT /api/chapters/:id - Update a chapter
router.put('/:id', chapterController.updateChapter);

// DELETE /api/chapters/:id - Delete a chapter
router.delete('/:id', chapterController.deleteChapter);

module.exports = router;
