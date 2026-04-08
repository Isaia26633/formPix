/**
 * Socket event handlers for sound events
 */

const { player } = require('../utils/soundUtils');

/**
 * @typedef {() => void} SoundEventHandler
 */

/**
 * Handle help sound event
 * @returns {SoundEventHandler} Sound event callback
 */
function handleHelpSound() {
	return () => {
		player.play('./sfx/formbarSFX/sfx_up04.wav')
	}
}

/**
 * Handle break sound event
 * @returns {SoundEventHandler} Sound event callback
 */
function handleBreakSound() {
	return () => {
		player.play('./sfx/formbarSFX/sfx_pickup02.wav')
	}
}

/**
 * Handle poll sound event
 * @returns {SoundEventHandler} Sound event callback
 */
function handlePollSound() {
	return () => {
		player.play('./sfx/formbarSFX/sfx_blip01.wav')
	}
}

/**
 * Handle remove poll sound event
 * @returns {SoundEventHandler} Sound event callback
 */
function handleRemovePollSound() {
	return () => {
		player.play('./sfx/formbarSFX/sfx_hit01.wav')
	}
}

/**
 * Handle join sound event
 * @returns {SoundEventHandler} Sound event callback
 */
function handleJoinSound() {
	return () => {
		player.play('./sfx/formbarSFX/sfx_up02.wav')
	}
}

/**
 * Handle leave sound event
 * @returns {SoundEventHandler} Sound event callback
 */
function handleLeaveSound() {
	return () => {
		player.play('./sfx/formbarSFX/sfx_laser01.wav')
	}
}

/**
 * Handle kick students sound event
 * @returns {SoundEventHandler} Sound event callback
 */
function handleKickStudentsSound() {
	return () => {
		player.play('./sfx/formbarSFX/sfx_splash01.wav')
	}
}

/**
 * Handle end class sound event
 * @returns {SoundEventHandler} Sound event callback
 */
function handleEndClassSound() {
	return () => {
		player.play('./sfx/formbarSFX/sfx_explode01.wav')
	}
}

/**
 * Handle timer sound event
 * @returns {SoundEventHandler} Sound event callback
 */
function handleTimerSound() {
	return () => {
		player.play('./sfx/formbarSFX/sfx_alarmclock.mp3')
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
