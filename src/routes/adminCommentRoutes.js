const express = require('express');
const router = express.Router();
const adminCommentController = require('../controllers/adminCommentController');
const authenticateToken = require('../../middleware/authMiddleware');
const authorizeAdmin = require('../../middleware/adminMiddleware');

// Admin routes protected by authentication and admin authorization
router.use(authenticateToken, authorizeAdmin);

// CRUD for comments by admin
router.get('/', adminCommentController.getAllComments);
router.get('/:id', adminCommentController.getCommentById);
router.post('/', adminCommentController.createComment);
router.put('/:id', adminCommentController.updateComment);
router.delete('/:id', adminCommentController.deleteComment);

module.exports = router;
