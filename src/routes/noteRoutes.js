const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const authenticateToken = require('../../middleware/authMiddleware');

// All routes protected by JWT auth
router.use(authenticateToken);

// GET /api/notes - All notes
router.get('/', noteController.getAllNotes);

// GET /api/notes/:id - Get a note by ID
router.get('/:id', noteController.getNoteById);

// GET /api/chapters/:id/notes - All notes for a chapter
router.get('/../chapters/:id/notes', noteController.getNotesByChapterId);

// POST /api/notes - Create a note
router.post('/', noteController.createNote);

// PUT /api/notes/:id - Update a note
router.put('/:id', noteController.updateNote);

// DELETE /api/notes/:id - Delete a note
router.delete('/:id', noteController.deleteNote);

module.exports = router;
