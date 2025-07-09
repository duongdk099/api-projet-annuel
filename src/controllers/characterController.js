const prisma = require('../../config/db');

// GET /api/characters - Return all characters
exports.getAllCharacters = async (req, res) => {
  try {
    // Only return characters for books owned by the user
    const userBooks = await prisma.book.findMany({
      where: { user_id: req.user.userId },
      select: { id: true },
    });
    const userBookIds = userBooks.map(b => b.id);
    const characters = await prisma.character.findMany({
      where: { book_id: { in: userBookIds } },
      orderBy: { id: 'asc' },
    });
    res.json({ message: 'Characters fetched successfully.', data: characters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/characters/:id - Return a character by ID if its book belongs to the user
exports.getCharacterById = async (req, res) => {
  const charId = parseInt(req.params.id, 10);
  if (isNaN(charId)) {
    return res.status(400).json({ message: 'Invalid character ID.' });
  }
  try {
    const character = await prisma.character.findUnique({ where: { id: charId } });
    if (!character) return res.status(404).json({ message: 'Character not found.' });
    const book = await prisma.book.findUnique({ where: { id: character.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Character not found or not owned by user.' });
    }
    res.json({ message: 'Character fetched successfully.', data: character });
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/books/:id/characters - Return all characters for a book
exports.getCharactersByBookId = async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  if (isNaN(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found or not owned by user.' });
    }
    const characters = await prisma.character.findMany({
      where: { book_id: bookId },
      orderBy: { id: 'asc' },
    });
    res.json({ message: 'Characters fetched successfully.', data: characters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/characters - Create a character
exports.createCharacter = async (req, res) => {
  const { book_id, name, alias, gender, age, physical_description, backstory, role, relations } = req.body;
  if (!book_id || isNaN(parseInt(book_id, 10))) {
    return res.status(400).json({ message: 'book_id is required and must be an integer.' });
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Name is required.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: parseInt(book_id, 10) } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found or not owned by user.' });
    }
    const newCharacter = await prisma.character.create({
      data: {
        book_id: parseInt(book_id, 10),
        name: name.trim(),
        alias: alias || null,
        gender: gender || null,
        age: age !== undefined ? parseInt(age, 10) : null,
        physical_description: physical_description || null,
        backstory: backstory || null,
        role: role || null,
        relations: relations || null,
      },
    });
    res.status(201).json({ message: 'Character created successfully.', data: newCharacter });
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/characters/:id - Update a character's fields
exports.updateCharacter = async (req, res) => {
  const charId = parseInt(req.params.id, 10);
  if (isNaN(charId)) {
    return res.status(400).json({ message: 'Invalid character ID.' });
  }
  const { name, alias, gender, age, physical_description, backstory, role, relations } = req.body;
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return res.status(400).json({ message: 'Name must be a non-empty string.' });
  }
  try {
    const character = await prisma.character.findUnique({ where: { id: charId } });
    if (!character) return res.status(404).json({ message: 'Character not found.' });
    const book = await prisma.book.findUnique({ where: { id: character.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Character not found or not owned by user.' });
    }
    const updatedCharacter = await prisma.character.update({
      where: { id: charId },
      data: {
        name: name !== undefined ? name.trim() : character.name,
        alias: alias !== undefined ? alias : character.alias,
        gender: gender !== undefined ? gender : character.gender,
        age: age !== undefined ? parseInt(age, 10) : character.age,
        physical_description: physical_description !== undefined ? physical_description : character.physical_description,
        backstory: backstory !== undefined ? backstory : character.backstory,
        role: role !== undefined ? role : character.role,
        relations: relations !== undefined ? relations : character.relations,
      },
    });
    res.json({ message: 'Character updated successfully.', data: updatedCharacter });
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// DELETE /api/characters/:id - Delete a character
exports.deleteCharacter = async (req, res) => {
  const charId = parseInt(req.params.id, 10);
  if (isNaN(charId)) {
    return res.status(400).json({ message: 'Invalid character ID.' });
  }
  try {
    const character = await prisma.character.findUnique({ where: { id: charId } });
    if (!character) return res.status(404).json({ message: 'Character not found.' });
    const book = await prisma.book.findUnique({ where: { id: character.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Character not found or not owned by user.' });
    }
    await prisma.character.delete({ where: { id: charId } });
    res.json({ message: 'Character deleted successfully.' });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
