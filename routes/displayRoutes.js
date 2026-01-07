/**
 * Routes for display and text operations
 */

const express = require('express');
const router = express.Router();
const { sayController } = require('../controllers/displayControllers');

// Route to display a text with a specified text color and background color
router.post('/say', sayController);

module.exports = router;
