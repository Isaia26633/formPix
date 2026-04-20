/**
 * Routes for pixel operations
 */

const express = require('express');
const router = express.Router();
const { fillController, fillByPercentController, gradientController, setPixelController, setPixelsController, progressController } = require('../controllers/pixelControllers');
const { raveController, raveStopController } = require('../controllers/raveControllers');
const cancelRave = require('../middleware/cancelRave');
const checkPollLock = require('../middleware/checkPollLock');

router.post('/fill', checkPollLock, cancelRave, fillController);
router.post('/fillByPercent', checkPollLock, cancelRave, fillByPercentController);
router.post('/gradient', checkPollLock, cancelRave, gradientController);
router.post('/setPixel', checkPollLock, cancelRave, setPixelController);
router.post('/setPixels', checkPollLock, cancelRave, setPixelsController);
router.post('/progress', checkPollLock, cancelRave, progressController);
router.post('/rave', checkPollLock, raveController);
router.post('/rave/stop', checkPollLock, raveStopController);

module.exports = router;
