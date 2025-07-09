const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authenticateToken = require('../../middleware/authMiddleware');

// All routes protected by JWT auth
router.use(authenticateToken);

// GET /api/comments - All comments
router.get('/', commentController.getAllComments);

// GET /api/comments/:id - Get a comment by ID
router.get('/:id', commentController.getCommentById);

// GET /api/chapters/:id/comments - All comments for a chapter
router.get('/../chapters/:id/comments', commentController.getCommentsByChapterId);

// POST /api/comments - Create a comment
router.post('/', commentController.createComment);

// PUT /api/comments/:id - Update a comment
router.put('/:id', commentController.updateComment);

// DELETE /api/comments/:id - Delete a comment
router.delete('/:id', commentController.deleteComment);

module.exports = router;
