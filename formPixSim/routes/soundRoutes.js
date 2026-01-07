/**
 * Routes for sound operations
 */

const express = require('express');
const router = express.Router();
const { getSoundsController, playSoundController } = require('../controllers/soundControllers');

router.get('/getSounds', getSoundsController);
router.post('/playSound', playSoundController);

module.exports = router;
