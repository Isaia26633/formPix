/**
 * Routes for pixel operations
 */

const express = require('express');
const router = express.Router();
const { fillController, fillByPercentController, gradientController, setPixelController, setPixelsController, progressController} = require('../controllers/pixelControllers');

router.post('/fill', fillController);
router.post('/fillByPercent', fillByPercentController);
router.post('/gradient', gradientController);
router.post('/setPixel', setPixelController);
router.post('/setPixels', setPixelsController);
router.post('/progress', progressController);

module.exports = router;