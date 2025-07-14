const prisma = require('../../config/db');

// Admin: CRUD for Characters
exports.getAllCharacters = async (req, res) => {
  try {
    const characters = await prisma.character.findMany();
    res.json({ message: 'All characters fetched successfully.', data: characters });
  } catch (error) {
    console.error('Error fetching all characters:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.getCharacterById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid character ID.' });
  try {
    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) return res.status(404).json({ message: 'Character not found.' });
    res.json({ message: 'Character fetched successfully.', data: character });
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.createCharacter = async (req, res) => {
  try {
    const character = await prisma.character.create({ data: req.body });
    res.status(201).json({ message: 'Character created successfully.', data: character });
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateCharacter = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid character ID.' });
  try {
    const character = await prisma.character.update({ where: { id }, data: req.body });
    res.json({ message: 'Character updated successfully.', data: character });
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deleteCharacter = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'Invalid character ID.' });
  try {
    await prisma.character.delete({ where: { id } });
    res.json({ message: 'Character deleted successfully.' });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
