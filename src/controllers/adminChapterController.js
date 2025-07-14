const prisma = require('../../config/db');

// Admin: CRUD for Chapters
exports.getAllChapters = async (req, res) => {
  try {
    const chapters = await prisma.chapter.findMany();
    res.json({ message: 'All chapters fetched successfully.', data: chapters });
  } catch (error) {
    console.error('Error fetching all chapters:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getChapterById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid chapter ID.' });
  try {
    const chapter = await prisma.chapter.findUnique({ where: { id } });
    if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });
    res.json({ message: 'Chapter fetched successfully.', data: chapter });
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.createChapter = async (req, res) => {
  const { book_id, title, content, order_index } = req.body;
  if (!book_id || isNaN(parseInt(book_id, 10))) return res.status(400).json({ message: 'book_id is required.' });
  if (!title || !title.trim()) return res.status(400).json({ message: 'title is required.' });
  try {
    const chapter = await prisma.chapter.create({
      data: { book_id: parseInt(book_id, 10), title: title.trim(), content, order_index }
    });
    res.status(201).json({ message: 'Chapter created successfully.', data: chapter });
  } catch (error) {
    console.error('Error creating chapter:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateChapter = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid chapter ID.' });
  try {
    const chapter = await prisma.chapter.update({ where: { id }, data: req.body });
    res.json({ message: 'Chapter updated successfully.', data: chapter });
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteChapter = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid chapter ID.' });
  try {
    await prisma.chapter.delete({ where: { id } });
    res.json({ message: 'Chapter deleted successfully.' });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
