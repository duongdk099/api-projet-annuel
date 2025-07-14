const express = require('express');
const router = express.Router();
const adminMapItemController = require('../controllers/adminMapItemController');
const authenticateToken = require('../../middleware/authMiddleware');
const authorizeAdmin = require('../../middleware/adminMiddleware');

// Admin routes protected by authentication and admin authorization
router.use(authenticateToken, authorizeAdmin);

// CRUD for map items by admin
router.get('/', adminMapItemController.getAllMapItems);
router.get('/:id', adminMapItemController.getMapItemById);
router.post('/', adminMapItemController.createMapItem);
router.put('/:id', adminMapItemController.updateMapItem);
router.delete('/:id', adminMapItemController.deleteMapItem);

module.exports = router;
