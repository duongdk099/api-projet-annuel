const prisma = require('../../config/db');

// GET /api/books - Get all books for authenticated user
exports.getAllBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: { user_id: req.user.userId },
      orderBy: { created_at: 'desc' },
    });
    res.json({ message: 'Books fetched successfully.', data: books });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/books/:id - Get a book by ID if it belongs to the user
exports.getBookById = async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  if (isNaN(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found.' });
    }
    res.json({ message: 'Book fetched successfully.', data: book });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/books - Create a new book
exports.createBook = async (req, res) => {
  const { title, description, genre, status } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Title is required.' });
  }
  try {
    const newBook = await prisma.book.create({
      data: {
        user_id: req.user.userId,
        title: title.trim(),
        description: description || null,
        genre: genre || null,
        status: status || null,
      },
    });
    res.status(201).json({ message: 'Book created successfully.', data: newBook });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/books/:id - Update a book if it belongs to the user
exports.updateBook = async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  if (isNaN(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID.' });
  }
  const { title, description, genre, status } = req.body;
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ message: 'Title must be a non-empty string.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found.' });
    }
    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: {
        title: title !== undefined ? title.trim() : book.title,
        description: description !== undefined ? description : book.description,
        genre: genre !== undefined ? genre : book.genre,
        status: status !== undefined ? status : book.status,
      },
    });
    res.json({ message: 'Book updated successfully.', data: updatedBook });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// DELETE /api/books/:id - Delete a book if it belongs to the user
exports.deleteBook = async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  if (isNaN(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found.' });
    }
    await prisma.book.delete({ where: { id: bookId } });
    res.json({ message: 'Book deleted successfully.' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
