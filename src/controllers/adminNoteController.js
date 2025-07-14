const prisma = require('../../config/db');

// Admin: CRUD for Notes
exports.getAllNotes = async (req, res) => {
  try {
    const notes = await prisma.note.findMany();
    res.json({ message: 'All notes fetched successfully.', data: notes });
  } catch (error) {
    console.error('Error fetching all notes:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getNoteById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid note ID.' });
  try {
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) return res.status(404).json({ message: 'Note not found.' });
    res.json({ message: 'Note fetched successfully.', data: note });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.createNote = async (req, res) => {
  try {
    const note = await prisma.note.create({ data: req.body });
    res.status(201).json({ message: 'Note created successfully.', data: note });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateNote = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid note ID.' });
  try {
    const note = await prisma.note.update({ where: { id }, data: req.body });
    res.json({ message: 'Note updated successfully.', data: note });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteNote = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid note ID.' });
  try {
    await prisma.note.delete({ where: { id } });
    res.json({ message: 'Note deleted successfully.' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
