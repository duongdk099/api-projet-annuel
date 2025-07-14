const prisma = require('../../config/db');

// Admin: CRUD for MapItems
exports.getAllMapItems = async (req, res) => {
  try {
    const items = await prisma.mapItem.findMany();
    res.json({ message: 'All map items fetched successfully.', data: items });
  } catch (error) {
    console.error('Error fetching all map items:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getMapItemById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid map item ID.' });
  try {
    const item = await prisma.mapItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ message: 'Map item not found.' });
    res.json({ message: 'Map item fetched successfully.', data: item });
  } catch (error) {
    console.error('Error fetching map item:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.createMapItem = async (req, res) => {
  try {
    const item = await prisma.mapItem.create({ data: req.body });
    res.status(201).json({ message: 'Map item created successfully.', data: item });
  } catch (error) {
    console.error('Error creating map item:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateMapItem = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid map item ID.' });
  try {
    const item = await prisma.mapItem.update({ where: { id }, data: req.body });
    res.json({ message: 'Map item updated successfully.', data: item });
  } catch (error) {
    console.error('Error updating map item:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteMapItem = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid map item ID.' });
  try {
    await prisma.mapItem.delete({ where: { id } });
    res.json({ message: 'Map item deleted successfully.' });
  } catch (error) {
    console.error('Error deleting map item:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
