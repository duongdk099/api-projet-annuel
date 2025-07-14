const prisma = require('../../config/db');

// Admin: CRUD for Stats
exports.getAllStats = async (req, res) => {
  try {
    const stats = await prisma.stat.findMany();
    res.json({ message: 'All stats fetched successfully.', data: stats });
  } catch (error) {
    console.error('Error fetching all stats:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getStatsByBookId = async (req, res) => {
  const bookId = parseInt(req.params.bookId, 10);
  if (isNaN(bookId)) return res.status(400).json({ message: 'Invalid book ID.' });
  try {
    const stat = await prisma.stat.findUnique({ where: { book_id: bookId } });
    if (!stat) return res.status(404).json({ message: 'Stats not found.' });
    res.json({ message: 'Stats fetched successfully.', data: stat });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.createStats = async (req, res) => {
  try {
    const stat = await prisma.stat.create({ data: req.body });
    res.status(201).json({ message: 'Stats created successfully.', data: stat });
  } catch (error) {
    console.error('Error creating stats:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateStats = async (req, res) => {
  const bookId = parseInt(req.params.bookId, 10);
  if (isNaN(bookId)) return res.status(400).json({ message: 'Invalid book ID.' });
  try {
    const stat = await prisma.stat.update({ where: { book_id: bookId }, data: req.body });
    res.json({ message: 'Stats updated successfully.', data: stat });
  } catch (error) {
    console.error('Error updating stats:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteStats = async (req, res) => {
  const bookId = parseInt(req.params.bookId, 10);
  if (isNaN(bookId)) return res.status(400).json({ message: 'Invalid book ID.' });
  try {
    await prisma.stat.delete({ where: { book_id: bookId } });
    res.json({ message: 'Stats deleted successfully.' });
  } catch (error) {
    console.error('Error deleting stats:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
