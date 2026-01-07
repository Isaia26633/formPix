/**
 * Socket event handlers for sound events
 */

const { player } = require('../utils/soundUtils');

/**
 * Handle help sound event
 */
function handleHelpSound() {
	player.play('./sfx/sfx_up04.wav')
}

/**
 * Handle break sound event
 */
function handleBreakSound() {
	player.play('./sfx/sfx_pickup02.wav')
}

/**
 * Handle poll sound event
 */
function handlePollSound() {
	player.play('./sfx/sfx_blip01.wav')
}

/**
 * Handle remove poll sound event
 */
function handleRemovePollSound() {
	player.play('./sfx/sfx_hit01.wav')
}

/**
 * Handle join sound event
 */
function handleJoinSound() {
	player.play('./sfx/sfx_up02.wav')
}

/**
 * Handle leave sound event
 */
function handleLeaveSound() {
	player.play('./sfx/sfx_laser01.wav')
}

/**
 * Handle kick students sound event
 */
function handleKickStudentsSound() {
	player.play('./sfx/sfx_splash01.wav')
}

/**
 * Handle end class sound event
 */
function handleEndClassSound() {
	player.play('./sfx/sfx_explode01.wav')
}

/**
 * Handle timer sound event
 */
function handleTimerSound() {
	player.play('./sfx/alarmClock.mp3')
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
