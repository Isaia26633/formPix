/**
 * Controllers for sound routes
 */

const logger = require('../utils/logger');
const { playSound } = require('../utils/soundUtils');

/**
 * POST /api/getSounds - Get list of available sounds
 */
async function getSoundsController(req, res) {
	try {
		logger.info('API Call: /api/getSounds', { query: req.query });
		const { sounds } = require('../state');

		let type = req.query.type

		if (type == 'formbar') res.status(200).json(sounds.formbarSFX)
		else if (type == 'meme') res.status(200).json(sounds.memeSFX)
		else if (type == null) res.status(200).json(sounds)
		else res.status(400).json({ source: 'Formpix', error: 'Invalid type' })
	} catch (err) {
		res.status(500).json({ source: 'Formpix', error: 'There was a server error try again' })
	}
}

/**
 * POST /api/playSound - Play a sound file
 */
async function playSoundController(req, res) {
	try {
		logger.info('API Call: /api/playSound', { query: req.query });
		const state = require('../state');
		// if a sound is playing already, reject the request
		if (state.isPlayingSound) {
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
				return res.status(400).json({ source: 'Formpix', error: 'volume must be an integer between 0 and 100' });
			}
		}

		let sound = playSound({ formbar, meme, volume: parsedVolume })

		if (typeof sound == 'string') {
			let status = 400
			if (sound.endsWith(' does not exist.')) status = 404

			logger.warn('Play sound failed', { error: sound, formbar, meme });
			res.status(status).json({ error: sound })
		} else if (sound === true || (sound && typeof sound.on === 'function')) {
			state.isPlayingSound = true;

			// If playSound returned a child process or event emitter, clear the flag when playback ends or errors.
			if (sound && typeof sound.on === 'function') {
				const clearIsPlayingSound = () => {
					state.isPlayingSound = false;
					if (typeof sound.removeListener === 'function') {
						sound.removeListener('close', clearIsPlayingSound);
						sound.removeListener('exit', clearIsPlayingSound);
						sound.removeListener('error', clearIsPlayingSound);
					}
				};

				sound.on('close', clearIsPlayingSound);
				sound.on('exit', clearIsPlayingSound);
				sound.on('error', clearIsPlayingSound);
			}
			logger.info('Sound played successfully', { formbar, meme });
			res.status(200).json({ message: 'ok' })

		} else res.status(500).json({ source: 'Formpix', error: 'There was a server error try again' })
	} catch (err) {
		logger.error('Error in playSoundController', { error: err.message, stack: err.stack, query: req.query });
		res.status(500).json({ source: 'Formpix', error: 'There was a server error try again' })
	}
}

module.exports = {
	getSoundsController,
	playSoundController
};
