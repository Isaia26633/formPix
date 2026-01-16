/**
 * Socket event handlers for sound events
 */

const { player } = require('../utils/soundUtils');

/**
 * Handle help sound event
 */
function handleHelpSound() {
	console.log('Playing help sound');
	player.play('./sfx/sfx_up04.wav')
}

/**
 * Handle break sound event
 */
function handleBreakSound() {
	console.log('Playing break sound');
	player.play('./sfx/sfx_pickup02.wav')
}

/**
 * Handle poll sound event
 */
function handlePollSound() {
	console.log('Playing poll sound');
	player.play('./sfx/sfx_blip01.wav')
}

/**
 * Handle remove poll sound event
 */
function handleRemovePollSound() {
	console.log('Playing remove poll sound');
	player.play('./sfx/sfx_hit01.wav')
}

/**
 * Handle join sound event
 */
function handleJoinSound() {
	console.log('Playing join sound');
	player.play('./sfx/sfx_up02.wav')
}

/**
 * Handle leave sound event
 */
function handleLeaveSound() {
	console.log('Playing leave sound');
	player.play('./sfx/sfx_laser01.wav')
}

/**
 * Handle kick students sound event
 */
function handleKickStudentsSound() {
	console.log('Playing kick students sound');
	player.play('./sfx/sfx_splash01.wav')
}

/**
 * Handle end class sound event
 */
function handleEndClassSound() {
	console.log('Playing end class sound');
	player.play('./sfx/sfx_explode01.wav')
}

/**
 * Handle timer sound event
 */
function handleTimerSound() {
	console.log('Playing timer sound');
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
