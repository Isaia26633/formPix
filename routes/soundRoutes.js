/**
 * Routes for sound operations
 */

const express = require('express');
const router = express.Router();
const { getSoundsController, playSoundController } = require('../controllers/soundControllers');

// Route to get available sounds
router.get('/getSounds', getSoundsController);

// Route to play a sound
router.post('/playSound', playSoundController);

module.exports = router;
