const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const auth = require('../middleware/auth');

// User routes
router.post('/', auth('user'), borrowController.borrowBook);

module.exports = router;
