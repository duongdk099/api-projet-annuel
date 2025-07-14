const express = require('express');
const router = express.Router();
const adminBookController = require('../controllers/adminBookController');

// CRUD for books by admin
router.get('/', adminBookController.getAllBooks);
router.get('/:id', adminBookController.getBookById);
router.post('/', adminBookController.createBook);
router.put('/:id', adminBookController.updateBook);
router.delete('/:id', adminBookController.deleteBook);

module.exports = router;
