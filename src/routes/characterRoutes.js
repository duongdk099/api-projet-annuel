const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');
const authenticateToken = require('../../middleware/authMiddleware');

// All routes protected by JWT auth
router.use(authenticateToken);

// GET /api/characters - All characters
router.get('/', characterController.getAllCharacters);

// GET /api/characters/:id - Get a character by ID
router.get('/:id', characterController.getCharacterById);

// GET /api/books/:id/characters - All characters for a book
router.get('/../books/:id/characters', characterController.getCharactersByBookId);

// POST /api/characters - Create a character
router.post('/', characterController.createCharacter);

// PUT /api/characters/:id - Update a character
router.put('/:id', characterController.updateCharacter);

// DELETE /api/characters/:id - Delete a character
router.delete('/:id', characterController.deleteCharacter);

module.exports = router;
