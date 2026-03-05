/**
 * Routes for sound operations
 */

const express = require('express');
const router = express.Router();
const { getSoundsController, playSoundController } = require('../controllers/soundControllers');

function createSoundRoutes(webIo) {
	router.get('/getSounds', getSoundsController);
	router.post('/playSound', (req, res) => playSoundController(req, res, webIo));
	
	return router;
}

module.exports = createSoundRoutes;
