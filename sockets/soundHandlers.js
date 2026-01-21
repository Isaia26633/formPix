/**
 * Socket event handlers for sound events
 */

const logger = require('../utils/logger');
const { playSound } = require('../utils/soundUtils');

/**
 * Handle help sound event
 */
function handleHelpSound() {
	return () => {
		logger.debug('Playing help sound');
		playSound({ sfx: 'sfx_up04.wav' });
	}
}

/**
 * Handle break sound event
 */
function handleBreakSound() {
	return () => {
		logger.debug('Playing break sound');
		playSound({ sfx: 'sfx_pickup02.wav' });
	}
}

/**
 * Handle poll sound event
 */
function handlePollSound() {
	return () => {
		logger.debug('Playing poll sound');
		playSound({ sfx: 'sfx_blip01.wav' });
	}
}

/**
 * Handle remove poll sound event
 */
function handleRemovePollSound() {
	return () => {
		logger.debug('Playing remove poll sound');
		playSound({ sfx: 'sfx_hit01.wav' });
	}
}

/**
 * Handle join sound event
 */
function handleJoinSound() {
	return () => {
		logger.debug('Playing join sound');
		playSound({ sfx: 'sfx_up02.wav' });
	}
}

/**
 * Handle leave sound event
 */
function handleLeaveSound() {
	return () => {
		logger.debug('Playing leave sound');
		playSound({ sfx: 'sfx_laser01.wav' });
	}
}

/**
 * Handle kick students sound event
 */
function handleKickStudentsSound() {
	return () => {
		logger.debug('Playing kick students sound');
		playSound({ sfx: 'sfx_splash01.wav' });
	}
}

/**
 * Handle end class sound event
 */
function handleEndClassSound() {
	return () => {
		logger.debug('Playing end class sound');
		playSound({ sfx: 'sfx_explode01.wav' });
	}
}

/**
 * Handle timer sound event
 */
function handleTimerSound() {
	return () => {
		logger.debug('Playing timer sound');
		playSound({ sfx: 'alarmClock.mp3' });
	}
}

module.exports = {
	handleHelpSound,
	handleBreakSound,
	handlePollSound,
	handleRemovePollSound,
	handleJoinSound,
	handleLeaveSound,
	handleKickStudentsSound,
	handleEndClassSound,
	handleTimerSound
};