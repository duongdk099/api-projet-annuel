const prisma = require('../../config/db');

// GET /api/stats - Return all stats
exports.getAllStats = async (req, res) => {
  try {
    // Only return stats for books owned by the user
    const userBooks = await prisma.book.findMany({
      where: { user_id: req.user.userId },
      select: { id: true },
    });
    const userBookIds = userBooks.map(b => b.id);
    const stats = await prisma.stat.findMany({
      where: { book_id: { in: userBookIds } },
      orderBy: { id: 'asc' },
    });
    res.json({ message: 'Stats fetched successfully.', data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/stats/:bookId - Return stats for a book if it belongs to the user
exports.getStatsByBookId = async (req, res) => {
  const bookId = parseInt(req.params.bookId, 10);
  if (isNaN(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found or not owned by user.' });
    }
    const stat = await prisma.stat.findUnique({ where: { book_id: bookId } });
    if (!stat) return res.status(404).json({ message: 'Stats not found for this book.' });
    res.json({ message: 'Stats fetched successfully.', data: stat });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/stats - Create stats for a book
exports.createStats = async (req, res) => {
  const { book_id, word_count, letter_count, total_goal, weekly_goal, deadline } = req.body;
  if (!book_id || isNaN(parseInt(book_id, 10))) {
    return res.status(400).json({ message: 'book_id is required and must be an integer.' });
  }
  if (word_count === undefined || isNaN(parseInt(word_count, 10))) {
    return res.status(400).json({ message: 'word_count is required and must be an integer.' });
  }
  if (letter_count === undefined || isNaN(parseInt(letter_count, 10))) {
    return res.status(400).json({ message: 'letter_count is required and must be an integer.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: parseInt(book_id, 10) } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found or not owned by user.' });
    }
    // Ensure only one stat per book
    const existing = await prisma.stat.findUnique({ where: { book_id: parseInt(book_id, 10) } });
    if (existing) {
      return res.status(409).json({ message: 'Stats already exist for this book.' });
    }
    const newStat = await prisma.stat.create({
      data: {
        book_id: parseInt(book_id, 10),
        word_count: parseInt(word_count, 10),
        letter_count: parseInt(letter_count, 10),
        total_goal: total_goal !== undefined ? parseInt(total_goal, 10) : null,
        weekly_goal: weekly_goal !== undefined ? parseInt(weekly_goal, 10) : null,
        deadline: deadline ? new Date(deadline) : null,
      },
    });
    res.status(201).json({ message: 'Stats created successfully.', data: newStat });
  } catch (error) {
    console.error('Error creating stats:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/stats/:bookId - Update stats
exports.updateStats = async (req, res) => {
  const bookId = parseInt(req.params.bookId, 10);
  if (isNaN(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID.' });
  }
  const { word_count, letter_count, total_goal, weekly_goal, deadline } = req.body;
  if (word_count !== undefined && isNaN(parseInt(word_count, 10))) {
    return res.status(400).json({ message: 'word_count must be an integer.' });
  }
  if (letter_count !== undefined && isNaN(parseInt(letter_count, 10))) {
    return res.status(400).json({ message: 'letter_count must be an integer.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found or not owned by user.' });
    }
    const stat = await prisma.stat.findUnique({ where: { book_id: bookId } });
    if (!stat) return res.status(404).json({ message: 'Stats not found for this book.' });
    const updatedStat = await prisma.stat.update({
      where: { book_id: bookId },
      data: {
        word_count: word_count !== undefined ? parseInt(word_count, 10) : stat.word_count,
        letter_count: letter_count !== undefined ? parseInt(letter_count, 10) : stat.letter_count,
        total_goal: total_goal !== undefined ? parseInt(total_goal, 10) : stat.total_goal,
        weekly_goal: weekly_goal !== undefined ? parseInt(weekly_goal, 10) : stat.weekly_goal,
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : stat.deadline,
      },
    });
    res.json({ message: 'Stats updated successfully.', data: updatedStat });
  } catch (error) {
    console.error('Error updating stats:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// DELETE /api/stats/:bookId - Delete stats
exports.deleteStats = async (req, res) => {
  const bookId = parseInt(req.params.bookId, 10);
  if (isNaN(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found or not owned by user.' });
    }
    const stat = await prisma.stat.findUnique({ where: { book_id: bookId } });
    if (!stat) return res.status(404).json({ message: 'Stats not found for this book.' });
    await prisma.stat.delete({ where: { book_id: bookId } });
    res.json({ message: 'Stats deleted successfully.' });
  } catch (error) {
    console.error('Error deleting stats:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
