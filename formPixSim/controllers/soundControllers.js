/**
 * Controllers for sound routes
 */

const logger = require('../utils/logger');
const { playSound } = require('../utils/soundUtils');

let isPlayingSound = false;

/**
 * GET /api/getSounds - Get list of available sounds
 */
async function getSoundsController(req, res) {
	try {
		const { sounds } = require('../state');
		
		let type = req.query.type

		if (type == 'formbar') res.status(200).json(sounds.formbarSFX)
		else if (type == 'meme') res.status(200).json(sounds.memeSFX)
		else if (type == null) res.status(200).json(sounds)
		else res.status(400).json({ error: 'Invalid type' })
	} catch (err) {
		logger.error('Error in getSoundsController', { error: err.message, stack: err.stack });
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

/**
 * POST /api/playSound - Play a sound file
 */
async function playSoundController(req, res, webIo) {
	try {
		// if a sound is playing already, reject the request
		if (isPlayingSound) {
			logger.warn('Play sound request rejected: another sound is already playing');
			return res.status(429).json({ error: 'Another sound is already playing' });
		}
		
		let { formbar, meme, volume } = req.query

		// Parse and validate volume (0–100). Defaults to 75 so API sounds are quieter than system sounds.
		let parsedVolume = 75;
		if (volume !== undefined) {
			parsedVolume = parseInt(volume);
			if (isNaN(parsedVolume) || parsedVolume < 0 || parsedVolume > 100) {
				logger.warn('Invalid volume parameter', { volume });
				return res.status(400).json({ error: 'volume must be an integer between 0 and 100' });
			}
		}

		let sound = playSound({ formbar, meme, volume: parsedVolume })

		if (typeof sound == 'string') {
			let status = 400
			if (sound.endsWith(' does not exist.')) status = 404

			logger.warn('Play sound failed', { error: sound, formbar, meme });
			res.status(status).json({ error: sound })
		} else if (sound && typeof sound === 'object' && sound.path) {
			isPlayingSound = true;
			
			// Emit sound and volume to all connected frontend clients
			let sockets = await webIo.fetchSockets();
			for (let socket of sockets) {
				socket.emit('play', { path: sound.path, volume: sound.volume });
			}
			
			// Reset flag after 30 seconds or when response finishes (whichever comes first)
			const resetPlayingFlag = () => {
				isPlayingSound = false;
			};
			res.once('finish', resetPlayingFlag);
			res.once('close', resetPlayingFlag);
			setTimeout(resetPlayingFlag, 30000); // 30 second timeout
			
			logger.info('Sound played successfully', { formbar, meme });
			res.status(200).json({ message: 'ok' })
			
		} else res.status(500).json({ error: 'There was a server error try again' })
	} catch (err) {
		logger.error('Error in playSoundController', { error: err.message, stack: err.stack, query: req.query });
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

module.exports = {
	getSoundsController,
	playSoundController
};
