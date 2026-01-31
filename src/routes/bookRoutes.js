const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);

// Admin routes
router.post('/', auth('admin'), bookController.createBook);
router.put('/:id', auth('admin'), bookController.updateBook);
router.delete('/:id', auth('admin'), bookController.deleteBook);

module.exports = router;
