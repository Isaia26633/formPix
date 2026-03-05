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

		if (type == 'bgm') res.status(200).json(sounds.bgm)
		else if (type == 'sfx') res.status(200).json(sounds.sfx)
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
		
		let { bgm, sfx } = req.query

		let sound = playSound({ bgm, sfx })

		if (typeof sound == 'string') {
			let status = 400
			if (sound.endsWith(' does not exist.')) status = 404

			logger.warn('Play sound failed', { error: sound, bgm, sfx });
			res.status(status).json({ error: sound })
		} else if (sound == true) {
			isPlayingSound = true;
			
			// Emit sound to all connected frontend clients
			let soundPath = bgm ? `./bgm/${bgm}` : `./sfx/${sfx}`;
			let sockets = await webIo.fetchSockets();
			for (let socket of sockets) {
				socket.emit('play', soundPath);
			}
			
			// Reset flag after 30 seconds or when response finishes (whichever comes first)
			const resetPlayingFlag = () => {
				isPlayingSound = false;
			};
			res.once('finish', resetPlayingFlag);
			res.once('close', resetPlayingFlag);
			setTimeout(resetPlayingFlag, 30000); // 30 second timeout
			
			logger.info('Sound played successfully', { bgm, sfx });
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
