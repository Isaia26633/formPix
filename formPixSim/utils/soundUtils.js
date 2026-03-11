/**
 * Sound management utilities for simulation
 */

const fs = require('fs');

/**
 * This function plays a sound file based on the provided parameters.
 * @param {Object} options - The options for playing sound.
 * @param {string} options.formbar - The filename of a formbar sound effect (in formbarSFX/).
 * @param {string} options.meme - The filename of a meme sound effect (in memeSFX/).
 * @param {number} [options.volume=100] - Playback volume as a percentage (0–100). Passed to the browser client.
 * @returns {{path: string, volume: number}|string} - Returns a play object if successful, otherwise an error message.
 */
function playSound({ formbar, meme, volume = 100 }) {
	if (!formbar && !meme) return 'Missing formbar or meme'
	if (formbar && meme) return 'You cannot send both formbar and meme'

	const clampedVolume = Math.max(0, Math.min(100, Number(volume) || 100));

	if (formbar) {
		if (fs.existsSync(`./sfx/formbarSFX/${formbar}`)) {
			return { path: `./sfx/formbarSFX/${formbar}`, volume: clampedVolume }
		} else {
			return `The sound effect ${formbar} does not exist.`
		}
	}

	if (meme) {
		if (fs.existsSync(`./sfx/memeSFX/${meme}`)) {
			return { path: `./sfx/memeSFX/${meme}`, volume: clampedVolume }
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
