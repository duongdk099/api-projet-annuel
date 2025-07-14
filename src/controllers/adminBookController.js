const prisma = require('../../config/db');

// Admin: CRUD for Books
exports.getAllBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany();
    res.json({ message: 'All books fetched successfully.', data: books });
  } catch (error) {
    console.error('Error fetching all books:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getBookById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid book ID.' });
  try {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    res.json({ message: 'Book fetched successfully.', data: book });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.createBook = async (req, res) => {
  const { user_id, title, description, genre, status } = req.body;
  if (!user_id || isNaN(parseInt(user_id,10))) return res.status(400).json({ message: 'user_id is required.' });
  if (!title || !title.trim()) return res.status(400).json({ message: 'title is required.' });
  try {
    const book = await prisma.book.create({ data: { user_id: parseInt(user_id,10), title: title.trim(), description, genre, status } });
    res.status(201).json({ message: 'Book created successfully.', data: book });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateBook = async (req, res) => {
  const id = parseInt(req.params.id,10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid book ID.' });
  try {
    const book = await prisma.book.update({ where: { id }, data: req.body });
    res.json({ message: 'Book updated successfully.', data: book });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteBook = async (req, res) => {
  const id = parseInt(req.params.id,10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid book ID.' });
  try {
    await prisma.book.delete({ where: { id } });
    res.json({ message: 'Book deleted successfully.' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
