/**
 * Sound management utilities for simulation
 */

const fs = require('fs');

/**
 * This function plays a sound file based on the provided parameters.
 * @param {Object} options - The options for playing sound.
 * @param {string} options.formbar - The filename of a formbar sound effect (in formbarSFX/).
 * @param {string} options.meme - The filename of a meme sound effect (in memeSFX/).
 * @returns {boolean|string} - Returns true if successful, otherwise an error message.
 */
function playSound({ formbar, meme }) {
	if (!formbar && !meme) return 'Missing formbar or meme'
	if (formbar && meme) return 'You cannot send both formbar and meme'

	if (formbar) {
		if (fs.existsSync(`./sfx/formbarSFX/${formbar}`)) {
			return true
		} else {
			return `The sound effect ${formbar} does not exist.`
		}
	}

	if (meme) {
		if (fs.existsSync(`./sfx/memeSFX/${meme}`)) {
			return true
		} else {
			return `The sound effect ${meme} does not exist.`
		}
	}

	return 'Unknown error'
}

/**
 * Load all sounds from directories
 * @returns {Object} Object with formbar and meme arrays
 */
function loadSounds() {
	return {
		formbarSFX: fs.readdirSync('./sfx/formbarSFX'),
		memeSFX: fs.readdirSync('./sfx/memeSFX')
	};
}

/**
 * Pick a random bootup sound from the two available
 * @returns {string} Path to a bootup sound
 */
function getRandomBootupSound() {
	const bootupSounds = ['sfx_bootup01.wav', 'sfx_bootup02.wav'];
	const pick = bootupSounds[Math.floor(Math.random() * bootupSounds.length)];
	return `./sfx/formbarSFX/${pick}`;
}

module.exports = {
	playSound,
	loadSounds,
	getRandomBootupSound
};
