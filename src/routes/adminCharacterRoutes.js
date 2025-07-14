const express = require('express');
const router = express.Router();
const adminCharacterController = require('../controllers/adminCharacterController');
const authenticateToken = require('../../middleware/authMiddleware');
const authorizeAdmin = require('../../middleware/adminMiddleware');

// Admin routes protected by authentication and admin authorization
router.use(authenticateToken, authorizeAdmin);

// CRUD for characters by admin
router.get('/', adminCharacterController.getAllCharacters);
router.get('/:id', adminCharacterController.getCharacterById);
router.post('/', adminCharacterController.createCharacter);
router.put('/:id', adminCharacterController.updateCharacter);
router.delete('/:id', adminCharacterController.deleteCharacter);

module.exports = router;
