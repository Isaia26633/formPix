/**
 * Routes for pixel operations
 */

const express = require('express');
const router = express.Router();
const { fillController, fillByPercentController, gradientController, setPixelController, setPixelsController, progressController, raveController, raveStopController} = require('../controllers/pixelControllers');

router.post('/fill', fillController);
router.post('/fillByPercent', fillByPercentController);
router.post('/gradient', gradientController);
router.post('/setPixel', setPixelController);
router.post('/setPixels', setPixelsController);
router.post('/progress', progressController);
router.post('/rave', raveController);
router.post('/rave/stop', raveStopController);

module.exports = router;
