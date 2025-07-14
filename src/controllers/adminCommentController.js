const prisma = require('../../config/db');

// Admin: CRUD for Comments
exports.getAllComments = async (req, res) => {
  try {
    const comments = await prisma.comment.findMany();
    res.json({ message: 'All comments fetched successfully.', data: comments });
  } catch (error) {
    console.error('Error fetching all comments:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getCommentById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid comment ID.' });
  try {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    res.json({ message: 'Comment fetched successfully.', data: comment });
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.createComment = async (req, res) => {
  try {
    const comment = await prisma.comment.create({ data: req.body });
    res.status(201).json({ message: 'Comment created successfully.', data: comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateComment = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid comment ID.' });
  try {
    const comment = await prisma.comment.update({ where: { id }, data: req.body });
    res.json({ message: 'Comment updated successfully.', data: comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteComment = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid comment ID.' });
  try {
    await prisma.comment.delete({ where: { id } });
    res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
