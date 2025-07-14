const express = require('express');
const router = express.Router();
const adminNoteController = require('../controllers/adminNoteController');
const authenticateToken = require('../../middleware/authMiddleware');
const authorizeAdmin = require('../../middleware/adminMiddleware');

// Admin routes protected by authentication and admin authorization
router.use(authenticateToken, authorizeAdmin);

// CRUD for notes by admin
router.get('/', adminNoteController.getAllNotes);
router.get('/:id', adminNoteController.getNoteById);
router.post('/', adminNoteController.createNote);
router.put('/:id', adminNoteController.updateNote);
router.delete('/:id', adminNoteController.deleteNote);

module.exports = router;
