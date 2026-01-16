/**
 * Controllers for sound routes
 */

const logger = require('../utils/logger');
const { playSound } = require('../utils/soundUtils');

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
async function playSoundController(req, res) {
	try {
		let { bgm, sfx } = req.query

		let sound = playSound({ bgm, sfx })

		if (typeof sound == 'string') {
			let status = 400
			if (sound.endsWith(' does not exist.')) status = 404

			logger.warn('Play sound failed', { error: sound, bgm, sfx });
			res.status(status).json({ error: sound })
		} else if (sound == true) {
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
