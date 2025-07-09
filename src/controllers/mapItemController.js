const prisma = require('../../config/db');

const VALID_TYPES = ['city', 'place', 'route'];

// GET /api/map-items - Return all map items
exports.getAllMapItems = async (req, res) => {
  try {
    // Only return map items for books owned by the user
    const userBooks = await prisma.book.findMany({
      where: { user_id: req.user.userId },
      select: { id: true },
    });
    const userBookIds = userBooks.map(b => b.id);
    const mapItems = await prisma.mapItem.findMany({
      where: { book_id: { in: userBookIds } },
      orderBy: { id: 'asc' },
    });
    res.json({ message: 'Map items fetched successfully.', data: mapItems });
  } catch (error) {
    console.error('Error fetching map items:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/map-items/:id - Return a map item by ID if its book belongs to the user
exports.getMapItemById = async (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  if (isNaN(itemId)) {
    return res.status(400).json({ message: 'Invalid map item ID.' });
  }
  try {
    const mapItem = await prisma.mapItem.findUnique({ where: { id: itemId } });
    if (!mapItem) return res.status(404).json({ message: 'Map item not found.' });
    const book = await prisma.book.findUnique({ where: { id: mapItem.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Map item not found or not owned by user.' });
    }
    res.json({ message: 'Map item fetched successfully.', data: mapItem });
  } catch (error) {
    console.error('Error fetching map item:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/books/:id/map-items - Return all map items for a book
exports.getMapItemsByBookId = async (req, res) => {
  const bookId = parseInt(req.params.id, 10);
  if (isNaN(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found or not owned by user.' });
    }
    const mapItems = await prisma.mapItem.findMany({
      where: { book_id: bookId },
      orderBy: { id: 'asc' },
    });
    res.json({ message: 'Map items fetched successfully.', data: mapItems });
  } catch (error) {
    console.error('Error fetching map items:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/map-items - Create a map item
exports.createMapItem = async (req, res) => {
  const { book_id, type, name, x, y, description } = req.body;
  if (!book_id || isNaN(parseInt(book_id, 10))) {
    return res.status(400).json({ message: 'book_id is required and must be an integer.' });
  }
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: 'type is required and must be one of: city, place, route.' });
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'name is required.' });
  }
  if (x === undefined || isNaN(parseFloat(x))) {
    return res.status(400).json({ message: 'x is required and must be a float.' });
  }
  if (y === undefined || isNaN(parseFloat(y))) {
    return res.status(400).json({ message: 'y is required and must be a float.' });
  }
  try {
    const book = await prisma.book.findUnique({ where: { id: parseInt(book_id, 10) } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Book not found or not owned by user.' });
    }
    const newMapItem = await prisma.mapItem.create({
      data: {
        book_id: parseInt(book_id, 10),
        type,
        name: name.trim(),
        x: parseFloat(x),
        y: parseFloat(y),
        description: description || null,
      },
    });
    res.status(201).json({ message: 'Map item created successfully.', data: newMapItem });
  } catch (error) {
    console.error('Error creating map item:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/map-items/:id - Update a map item
exports.updateMapItem = async (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  if (isNaN(itemId)) {
    return res.status(400).json({ message: 'Invalid map item ID.' });
  }
  const { type, name, x, y, description } = req.body;
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: 'type must be one of: city, place, route.' });
  }
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return res.status(400).json({ message: 'name must be a non-empty string.' });
  }
  if (x !== undefined && isNaN(parseFloat(x))) {
    return res.status(400).json({ message: 'x must be a float.' });
  }
  if (y !== undefined && isNaN(parseFloat(y))) {
    return res.status(400).json({ message: 'y must be a float.' });
  }
  try {
    const mapItem = await prisma.mapItem.findUnique({ where: { id: itemId } });
    if (!mapItem) return res.status(404).json({ message: 'Map item not found.' });
    const book = await prisma.book.findUnique({ where: { id: mapItem.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Map item not found or not owned by user.' });
    }
    const updatedMapItem = await prisma.mapItem.update({
      where: { id: itemId },
      data: {
        type: type !== undefined ? type : mapItem.type,
        name: name !== undefined ? name.trim() : mapItem.name,
        x: x !== undefined ? parseFloat(x) : mapItem.x,
        y: y !== undefined ? parseFloat(y) : mapItem.y,
        description: description !== undefined ? description : mapItem.description,
      },
    });
    res.json({ message: 'Map item updated successfully.', data: updatedMapItem });
  } catch (error) {
    console.error('Error updating map item:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// DELETE /api/map-items/:id - Delete a map item
exports.deleteMapItem = async (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  if (isNaN(itemId)) {
    return res.status(400).json({ message: 'Invalid map item ID.' });
  }
  try {
    const mapItem = await prisma.mapItem.findUnique({ where: { id: itemId } });
    if (!mapItem) return res.status(404).json({ message: 'Map item not found.' });
    const book = await prisma.book.findUnique({ where: { id: mapItem.book_id } });
    if (!book || book.user_id !== req.user.userId) {
      return res.status(404).json({ message: 'Map item not found or not owned by user.' });
    }
    await prisma.mapItem.delete({ where: { id: itemId } });
    res.json({ message: 'Map item deleted successfully.' });
  } catch (error) {
    console.error('Error deleting map item:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
