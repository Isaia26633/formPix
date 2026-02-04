/**
 * Controllers for sound routes
 */

const { playSound } = require('../utils/soundUtils');

/**
 * POST /api/getSounds - Get list of available sounds
 */
async function getSoundsController(req, res) {
	try {
		const { sounds } = require('../state');

		let type = req.query.type

		if (type == 'bgm') res.status(200).json(sounds.bgm)
		else if (type == 'sfx') res.status(200).json(sounds.sfx)
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
		} else if (sound === true || (sound && typeof sound.on === 'function')) {
			isPlayingSound = true;

			// If playSound returned a child process or event emitter, clear the flag when playback ends or errors.
			if (sound && typeof sound.on === 'function') {
				const clearIsPlayingSound = () => {
					isPlayingSound = false;
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
			logger.info('Sound played successfully', { bgm, sfx });
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
