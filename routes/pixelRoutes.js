/**
 * Routes for pixel operations
 */

const express = require('express');
const router = express.Router();
const { fillController, fillByPercentController, gradientController, setPixelController, setPixelsController } = require('../controllers/pixelControllers');

router.post('/fill', fillController);
router.post('/fillByPercent', fillByPercentController);
router.post('/gradient', gradientController);
router.post('/setPixel', setPixelController);
router.post('/setPixels', setPixelsController);

module.exports = router;