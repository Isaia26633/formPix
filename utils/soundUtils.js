/**
 * Sound management utilities
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Helper function to check if a command exists
function commandExists(cmd) {
	try {
		execSync(`where ${cmd}`, { stdio: 'ignore', shell: 'powershell.exe' });
		return true;
	} catch {
		try {
			execSync(`which ${cmd}`, { stdio: 'ignore' });
			return true;
		} catch {
			return false;
		}
	}
}

// Initialize player with fallback: try omxplayer, then vlc
let player;
let playerType = 'none';

if (commandExists('omxplayer')) {
	player = require('play-sound')({ player: 'omxplayer' });
	playerType = 'omxplayer';
	console.log('✓ Initialized audio player with omxplayer');
} else if (commandExists('cvlc')) {
	player = require('play-sound')({ player: 'cvlc' });
	playerType = 'vlc';
	console.log('✓ Initialized audio player with cvlc');
} else {
	try {
		player = require('play-sound')({});
		playerType = 'default';
		console.log('✓ Initialized audio player with default player');
	} catch (error) {
		player = null;
		playerType = 'none';
		console.warn('⚠ Audio playback disabled - no player available');
	}
}

/**
 * This function plays a sound file based on the provided parameters.
 * @param {Object} options - The options for playing sound.
 * @param {string} options.formbar - The filename of a formbar sound effect (in formbarSFX/).
 * @param {string} options.meme - The filename of a meme sound effect (in memeSFX/).
 * @returns {boolean|string} - Returns true if successful, otherwise an error message.
 */
function playSound({ formbar, meme }) {
	if (!player) return 'Audio player not available - no compatible player found'

	if (!formbar && !meme) return 'Missing formbar or meme'
	if (formbar && meme) return 'You cannot send both formbar and meme'

	if (formbar) {
		if (fs.existsSync(`./sfx/formbarSFX/${formbar}`)) {
			try {
				const proc = player.play(`./sfx/formbarSFX/${formbar}`, (err) => {
					if (err && !err.killed) {
						console.error('Error playing formbar sound:', err.message);
					}
				});
				return proc || true
			} catch (err) {
				console.error('Error playing formbar sound:', err.message);
				return `Error playing formbar sound: ${err.message}`
			}
		} else {
			return `The sound effect ${formbar} does not exist.`
		}
	}

	if (meme) {
		if (fs.existsSync(`./sfx/memeSFX/${meme}`)) {
			try {
				const proc = player.play(`./sfx/memeSFX/${meme}`, (err) => {
					if (err && !err.killed) {
						console.error('Error playing meme sound:', err.message);
					}
				});
				return proc || true
			} catch (err) {
				console.error('Error playing meme sound:', err.message);
				return `Error playing meme sound: ${err.message}`
			}
		} else {
			return `The sound effect ${meme} does not exist.`
		}
	}

	return 'Unknown error'
}

/**
 * Load all sounds from directories
 * @returns {Object} Object with formbarSFX and memeSFX arrays
 */
function loadSounds() {
	return {
		formbarSFX: fs.readdirSync('./sfx/formbarSFX'),
		memeSFX: fs.readdirSync('./sfx/memeSFX')
	};
}

/**
 * Pick a random bootup sound from the two available
 * @returns {string} Filename of a bootup sound
 */
function getRandomBootupSound() {
	const bootupSounds = ['sfx_bootup01.wav', 'sfx_bootup02.wav'];
	return bootupSounds[Math.floor(Math.random() * bootupSounds.length)];
}

module.exports = {
	playSound,
	loadSounds,
	getRandomBootupSound,
	player
};
