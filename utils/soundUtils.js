/**
 * Sound management utilities
 */

const fs = require('fs');

// Initialize player with fallback options
let player = null;
let playerType = 'none';

// Try different audio players in order of preference
const players = [
	{ name: 'vlc', cmd: 'cvlc' },
	{ name: 'omxplayer', cmd: 'omxplayer' },
	{ name: 'mpg123', cmd: 'mpg123' },
	{ name: 'afplay', cmd: 'afplay' },  // macOS
	{ name: 'mplayer', cmd: 'mplayer' }
];

for (const p of players) {
	try {
		player = require('play-sound')({ player: p.cmd });
		playerType = p.name;
		console.log(`✓ Audio player initialized with ${p.name}`);
		break;
	} catch (err) {
		// Try next player
	}
}

if (!player) {
	console.warn('⚠ No audio player found - audio playback disabled');
	console.warn('  Install one of: vlc, omxplayer, mpg123, mplayer');
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
				const audio = player.play(`./bgm/${bgm}`, (err) => {
					if (err) console.error('Error playing bgm:', err.message);
				});
				if (audio && audio.on) {
					audio.once('error', (err) => {
						console.error('Audio process error (bgm):', err.message);
					});
				}
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
				const audio = player.play(`./sfx/${sfx}`, (err) => {
					if (err) console.error('Error playing sfx:', err.message);
				});
				if (audio && audio.on) {
					audio.once('error', (err) => {
						console.error('Audio process error (sfx):', err.message);
					});
				}
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
