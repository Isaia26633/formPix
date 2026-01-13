/**
 * Sound management utilities
 */

const fs = require('fs');

// Initialize player with fallback: try omxplayer, then vlc
let player;
try {
	player = require('play-sound')({ player: 'omxplayer' });
	console.log('✓ Initialized audio player with omxplayer');
} catch (omxError) {
	console.warn('✗ omxplayer failed, falling back to vlc:', omxError.message);
	try {
		player = require('play-sound')({ player: 'cvlc' });
		console.log('✓ Initialized audio player with vlc');
	} catch (vlcError) {
		console.error('✗ vlc also failed:', vlcError.message);
		player = null;
		console.warn('⚠ Audio playback disabled - no player available');
	}
}

/**
 * This function plays a sound file based on the provided parameters.
 * @param {Object} options - The options for playing sound.
 * @param {string} options.bgm - The filename of the background music to play.
 * @param {string} options.sfx - The filename of the sound effect to play.
 * @returns {boolean|string} - Returns true if successful, otherwise an error message.
 */
function playSound({ bgm, sfx }) {
	if (!player) return 'Audio player not available - no compatible player found'
	
	if (!bgm && !sfx) return 'Missing bgm or sfx'
	if (bgm && sfx) return 'You can not send both bgm and sfx'

	if (bgm) {
		if (fs.existsSync(`./bgm/${bgm}`)) {
			try {
				player.play(`./bgm/${bgm}`)
				return true
			} catch (err) {
				console.error('Error playing bgm:', err.message);
				return `Error playing background music: ${err.message}`
			}
		} else {
			return `The background music ${bgm} does not exist.`
		}
	}

	if (sfx) {
		if (fs.existsSync(`./sfx/${sfx}`)) {
			try {
				player.play(`./sfx/${sfx}`)
				return true
			} catch (err) {
				console.error('Error playing sfx:', err.message);
				return `Error playing sound effect: ${err.message}`
			}
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
	loadSounds,
	player
};
