/**
 * Routes for pixel operations
 */

const express = require('express');
const router = express.Router();
const { fillController, gradientController, setPixelController, setPixelsController } = require('../controllers/pixelControllers');

// Route to fill the bar with a color
router.post('/fill', fillController);

// Route to fill a gradient on the bar with a color
router.post('/gradient', gradientController);

// Route to set a specific pixel with a color
router.post('/setPixel', setPixelController);

// Route to set multiple pixels with colors
router.post('/setPixels', setPixelsController);

module.exports = router;
