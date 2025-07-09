const prisma = require('../../config/db');

// GET /api/chapters - All chapters, optionally filtered by book_id
exports.getAllChapters = async (req, res) => {
  const { book_id } = req.query;
  try {
    let where = {};
    if (book_id) {
      const book = await prisma.book.findUnique({ where: { id: parseInt(book_id, 10) } });
      if (!book || book.user_id !== req.user.userId) {
        return res.status(404).json({ message: 'Book not found or not owned by user.' });
      }
      where.book_id = parseInt(book_id, 10);
    } else {
      // Only return chapters for books owned by the user
      const userBooks = await prisma.book.findMany({
        where: { user_id: req.user.userId },
        select: { id: true },
      });
      where.book_id = { in: userBooks.map(b => b.id) };
    }
    const chapters = await prisma.chapter.findMany({
      where,
      orderBy: [{ book_id: 'asc' }, { order_index: 'asc' }],
    });
    res.json({ message: 'Chapters fetched successfully.', data: chapters });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/chapters/:id - Get a chapter by ID if its book belongs to the user
exports.getChapterById = async (req, res) => {
  const chapterId = parseInt(req.params.id, 10);
  if (isNaN(chapterId)) {
    return res.status(400).json({ message: 'Invalid chapter ID.' });
  }
  try {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });
    const book = await prisma.book.findUnique({ where: { id: chapter.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Chapter not found or not owned by user.' });
    }
    res.json({ message: 'Chapter fetched successfully.', data: chapter });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/books/:bookId/chapters - All chapters for a book if it belongs to the user
exports.getChaptersByBookId = async (req, res) => {
  const bookId = parseInt(req.params.bookId, 10);
  if (isNaN(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found or not owned by user.' });
    }
    const chapters = await prisma.chapter.findMany({
      where: { book_id: bookId },
      orderBy: { order_index: 'asc' },
    });
    res.json({ message: 'Chapters fetched successfully.', data: chapters });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/chapters - Create a chapter
exports.createChapter = async (req, res) => {
  const { book_id, title, content, order_index } = req.body;
  if (!book_id || isNaN(parseInt(book_id, 10))) {
    return res.status(400).json({ message: 'book_id is required and must be an integer.' });
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Title is required.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: parseInt(book_id, 10) } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found or not owned by user.' });
    }
    const newChapter = await prisma.chapter.create({
      data: {
        book_id: parseInt(book_id, 10),
        title: title.trim(),
        content: content || null,
        order_index: order_index !== undefined ? parseInt(order_index, 10) : 0,
      },
    });
    res.status(201).json({ message: 'Chapter created successfully.', data: newChapter });
  } catch (error) {
    console.error('Error creating chapter:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/chapters/:id - Update a chapter
exports.updateChapter = async (req, res) => {
  const chapterId = parseInt(req.params.id, 10);
  if (isNaN(chapterId)) {
    return res.status(400).json({ message: 'Invalid chapter ID.' });
  }
  const { title, content, order_index } = req.body;
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ message: 'Title must be a non-empty string.' });
  }
  try {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });
    const book = await prisma.book.findUnique({ where: { id: chapter.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Chapter not found or not owned by user.' });
    }
    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        title: title !== undefined ? title.trim() : chapter.title,
        content: content !== undefined ? content : chapter.content,
        order_index: order_index !== undefined ? parseInt(order_index, 10) : chapter.order_index,
      },
    });
    res.json({ message: 'Chapter updated successfully.', data: updatedChapter });
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// DELETE /api/chapters/:id - Delete a chapter if its book belongs to the user
exports.deleteChapter = async (req, res) => {
  const chapterId = parseInt(req.params.id, 10);
  if (isNaN(chapterId)) {
    return res.status(400).json({ message: 'Invalid chapter ID.' });
  }
  try {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });
    const book = await prisma.book.findUnique({ where: { id: chapter.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Chapter not found or not owned by user.' });
    }
    await prisma.chapter.delete({ where: { id: chapterId } });
    res.json({ message: 'Chapter deleted successfully.' });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
