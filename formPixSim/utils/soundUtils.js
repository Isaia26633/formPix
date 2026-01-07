/**
 * Sound management utilities for simulation
 */

const fs = require('fs');

/**
 * This function plays a sound file based on the provided parameters.
 * @param {Object} options - The options for playing sound.
 * @param {string} options.bgm - The filename of the background music to play.
 * @param {string} options.sfx - The filename of the sound effect to play.
 * @returns {boolean|string} - Returns true if successful, otherwise an error message.
 */
function playSound({ bgm, sfx }) {
	if (!bgm && !sfx) return 'Missing bgm or sfx'
	if (bgm && sfx) return 'You can not send both bgm and sfx'

	if (bgm) {
		if (fs.existsSync(`./bgm/${bgm}`)) {
			return true
		} else {
			return `The background music ${bgm} does not exist.`
		}
	}

	if (sfx) {
		if (fs.existsSync(`./sfx/${sfx}`)) {
			return true
		} else {
			return `The sound effect ${sfx} does not exist.`
		}
	}

	return 'Unknown error'
}

/**
 * Load all sounds from directories
 * @returns {Object} Object with bgm and sfx arrays
 */
function loadSounds() {
	return {
		bgm: fs.readdirSync('./bgm'),
		sfx: fs.readdirSync('./sfx')
	};
}

module.exports = {
	playSound,
	loadSounds
};
