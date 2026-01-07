/**
 * Routes for pixel operations
 */

const express = require('express');
const router = express.Router();
const { fillController, gradientController, setPixelController, setPixelsController } = require('../controllers/pixelControllers');

router.post('/fill', fillController);
router.post('/gradient', gradientController);
router.post('/setPixel', setPixelController);
router.post('/setPixels', setPixelsController);

module.exports = router;
