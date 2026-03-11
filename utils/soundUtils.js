/**
 * Sound management utilities
 */

const fs = require('fs');
const { execSync, spawn } = require('child_process');

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
 * Convert a volume percentage (0–100) to player-specific command-line arguments.
 * @param {number} volume - Volume level from 0 to 100.
 * @returns {string[]} Extra args to prepend before the filename.
 */
function getVolumeArgs(volume) {
	if (playerType === 'omxplayer') {
		// omxplayer --vol takes millibels (100ths of a decibel); 0 = no change
		const millibels = volume <= 0 ? -9999 : Math.round(2000 * Math.log10(volume / 100));
		return ['--vol', String(millibels)];
	} else if (playerType === 'vlc') {
		// cvlc --gain takes a float multiplier where 1.0 = 100%
		return ['--gain', (volume / 100).toFixed(2)];
	}
	return [];
}

/**
 * This function plays a sound file based on the provided parameters.
 * @param {Object} options - The options for playing sound.
 * @param {string} options.formbar - The filename of a formbar sound effect (in formbarSFX/).
 * @param {string} options.meme - The filename of a meme sound effect (in memeSFX/).
 * @param {number} [options.volume=100] - Playback volume as a percentage (0–100). Supported with omxplayer and cvlc.
 * @returns {ChildProcess|boolean|string} - Returns the child process if successful, true for default player, otherwise an error message.
 */
function playSound({ formbar, meme, volume = 100 }) {
	if (!player) return 'Audio player not available - no compatible player found'

	if (!formbar && !meme) return 'Missing formbar or meme'
	if (formbar && meme) return 'You cannot send both formbar and meme'

	const filePath = formbar ? `./sfx/formbarSFX/${formbar}` : `./sfx/memeSFX/${meme}`;
	const soundName = formbar || meme;
	const soundType = formbar ? 'formbar' : 'meme';

	if (!fs.existsSync(filePath)) {
		return `The sound effect ${soundName} does not exist.`
	}

	// Clamp volume between 0 and 100
	const clampedVolume = Math.max(0, Math.min(100, Number(volume) || 100));

	try {
		// Use spawn directly when volume is not 100% and the player supports it
		if (clampedVolume !== 100 && (playerType === 'omxplayer' || playerType === 'vlc')) {
			const playerCmd = playerType === 'omxplayer' ? 'omxplayer' : 'cvlc';
			const volumeArgs = getVolumeArgs(clampedVolume);
			const playerArgs = playerType === 'vlc'
				? [...volumeArgs, '--play-and-exit', filePath]
				: [...volumeArgs, filePath];
			const proc = spawn(playerCmd, playerArgs, { stdio: 'ignore', detached: false });
			proc.on('error', (err) => {
				console.error(`Error spawning ${playerCmd}:`, err.message);
			});
			return proc;
		}

		// Fall back to play-sound for the default player or when volume is 100
		const proc = player.play(filePath, (err) => {
			if (err && !err.killed) {
				console.error(`Error playing ${soundType} sound:`, err.message);
			}
		});
		return proc || true;
	} catch (err) {
		console.error(`Error playing ${soundType} sound:`, err.message);
		return `Error playing ${soundType} sound: ${err.message}`;
	}
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
