const prisma = require('../../config/db');

// GET /api/notes - Return all notes
exports.getAllNotes = async (req, res) => {
  try {
    // Only return notes for chapters whose books belong to the user
    const userBooks = await prisma.book.findMany({
      where: { user_id: req.user.userId },
      select: { id: true },
    });
    const userBookIds = userBooks.map(b => b.id);
    const userChapters = await prisma.chapter.findMany({
      where: { book_id: { in: userBookIds } },
      select: { id: true },
    });
    const userChapterIds = userChapters.map(c => c.id);
    const notes = await prisma.note.findMany({
      where: { chapter_id: { in: userChapterIds } },
      orderBy: { created_at: 'desc' },
    });
    res.json({ message: 'Notes fetched successfully.', data: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/notes/:id - Return a note by ID if its chapter's book belongs to the user
exports.getNoteById = async (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  if (isNaN(noteId)) {
    return res.status(400).json({ message: 'Invalid note ID.' });
  }
  try {
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) return res.status(404).json({ message: 'Note not found.' });
    const chapter = await prisma.chapter.findUnique({ where: { id: note.chapter_id } });
    if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });
    const book = await prisma.book.findUnique({ where: { id: chapter.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Note not found or not owned by user.' });
    }
    res.json({ message: 'Note fetched successfully.', data: note });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/chapters/:id/notes - Return all notes for a chapter if its book belongs to the user
exports.getNotesByChapterId = async (req, res) => {
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
    const notes = await prisma.note.findMany({
      where: { chapter_id: chapterId },
      orderBy: { created_at: 'desc' },
    });
    res.json({ message: 'Notes fetched successfully.', data: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/notes - Create a note
exports.createNote = async (req, res) => {
  const { chapter_id, content, line_position } = req.body;
  if (!chapter_id || isNaN(parseInt(chapter_id, 10))) {
    return res.status(400).json({ message: 'chapter_id is required and must be an integer.' });
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ message: 'Content is required.' });
  }
  try {
    const chapter = await prisma.chapter.findUnique({ where: { id: parseInt(chapter_id, 10) } });
    if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });
    const book = await prisma.book.findUnique({ where: { id: chapter.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Chapter not found or not owned by user.' });
    }
    const newNote = await prisma.note.create({
      data: {
        chapter_id: parseInt(chapter_id, 10),
        content: content.trim(),
        line_position: line_position !== undefined ? parseInt(line_position, 10) : null,
      },
    });
    res.status(201).json({ message: 'Note created successfully.', data: newNote });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/notes/:id - Update a note's content, line_position
exports.updateNote = async (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  if (isNaN(noteId)) {
    return res.status(400).json({ message: 'Invalid note ID.' });
  }
  const { content, line_position } = req.body;
  if (content !== undefined && (typeof content !== 'string' || !content.trim())) {
    return res.status(400).json({ message: 'Content must be a non-empty string.' });
  }
  try {
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) return res.status(404).json({ message: 'Note not found.' });
    const chapter = await prisma.chapter.findUnique({ where: { id: note.chapter_id } });
    if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });
    const book = await prisma.book.findUnique({ where: { id: chapter.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Note not found or not owned by user.' });
    }
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        content: content !== undefined ? content.trim() : note.content,
        line_position: line_position !== undefined ? parseInt(line_position, 10) : note.line_position,
      },
    });
    res.json({ message: 'Note updated successfully.', data: updatedNote });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// DELETE /api/notes/:id - Delete a note
exports.deleteNote = async (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  if (isNaN(noteId)) {
    return res.status(400).json({ message: 'Invalid note ID.' });
  }
  try {
    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note) return res.status(404).json({ message: 'Note not found.' });
    const chapter = await prisma.chapter.findUnique({ where: { id: note.chapter_id } });
    if (!chapter) return res.status(404).json({ message: 'Chapter not found.' });
    const book = await prisma.book.findUnique({ where: { id: chapter.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Note not found or not owned by user.' });
    }
    await prisma.note.delete({ where: { id: noteId } });
    res.json({ message: 'Note deleted successfully.' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
