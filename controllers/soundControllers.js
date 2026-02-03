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
		let { bgm, sfx } = req.query

		let sound = playSound({ bgm, sfx })

		if (typeof sound == 'string') {
			let status = 400
			if (sound.endsWith(' does not exist.')) status = 404

			res.status(status).json({ source: 'Formpix', error: sound })
		} else if (sound == true) res.status(200).json({ message: 'ok' })
		else res.status(500).json({ source: 'Formpix', error: 'There was a server error try again' })
	} catch (err) {
		res.status(500).json({ source: 'Formpix', error: 'There was a server error try again' })
	}
}

module.exports = {
	getSoundsController,
	playSoundController
};
