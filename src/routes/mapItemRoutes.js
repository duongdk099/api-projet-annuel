const express = require('express');
const router = express.Router();
const mapItemController = require('../controllers/mapItemController');
const authenticateToken = require('../../middleware/authMiddleware');

// All routes protected by JWT auth
router.use(authenticateToken);

// GET /api/map-items - All map items
router.get('/', mapItemController.getAllMapItems);

// GET /api/map-items/:id - Get a map item by ID
router.get('/:id', mapItemController.getMapItemById);

// GET /api/books/:id/map-items - All map items for a book
router.get('/../books/:id/map-items', mapItemController.getMapItemsByBookId);

// POST /api/map-items - Create a map item
router.post('/', mapItemController.createMapItem);

// PUT /api/map-items/:id - Update a map item
router.put('/:id', mapItemController.updateMapItem);

// DELETE /api/map-items/:id - Delete a map item
router.delete('/:id', mapItemController.deleteMapItem);

module.exports = router;
