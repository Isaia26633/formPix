/**
 * Routes for sound operations
 */

const express = require('express');
const router = express.Router();
const { getSoundsController, playSoundController } = require('../controllers/soundControllers');

/**
 * Build sound routes with access to the socket.io web server.
 * @param {{fetchSockets: () => Promise<Array<{emit: (event: string, payload?: unknown) => void}>>}} webIo - Socket.io server wrapper.
 * @returns {import('express').Router} Configured express router.
 */
function createSoundRoutes(webIo) {
	/**
	 * Handle /playSound requests with the injected socket server.
	 * @param {import('express').Request} req - Express request object.
	 * @param {import('express').Response} res - Express response object.
	 * @returns {Promise<void>} Resolves when controller finishes.
	 */
	async function handlePlaySoundRequest(req, res) {
		await playSoundController(req, res, webIo);
	}

	router.get('/getSounds', getSoundsController);
	router.post('/playSound', handlePlaySoundRequest);
	
	return router;
}

module.exports = createSoundRoutes;
