/**
 * Socket event handlers for sound events
 */

/**
 * Create player-like object that emits to web clients
 */
function createSimPlayer(webIo) {
	return {
		play: async (string, options) => {
			let sockets = await webIo.fetchSockets()
			for (let socket of sockets) {
				socket.emit('play', string)
			}
		}
	}
}

/**
 * Handle help sound event
 */
function handleHelpSound(webIo) {
	return async () => {
		let player = createSimPlayer(webIo);
		player.play('./sfx/sfx_up04.wav')
	}
}

/**
 * Handle break sound event
 */
function handleBreakSound(webIo) {
	return async () => {
		let player = createSimPlayer(webIo);
		player.play('./sfx/sfx_pickup02.wav')
	}
}

/**
 * Handle poll sound event
 */
function handlePollSound(webIo) {
	return async () => {
		let player = createSimPlayer(webIo);
		player.play('./sfx/sfx_blip01.wav')
	}
}

/**
 * Handle remove poll sound event
 */
function handleRemovePollSound(webIo) {
	return async () => {
		let player = createSimPlayer(webIo);
		player.play('./sfx/sfx_hit01.wav')
	}
}

/**
 * Handle join sound event
 */
function handleJoinSound(webIo) {
	return async () => {
		let player = createSimPlayer(webIo);
		player.play('./sfx/sfx_up02.wav')
	}
}

/**
 * Handle leave sound event
 */
function handleLeaveSound(webIo) {
	return async () => {
		let player = createSimPlayer(webIo);
		player.play('./sfx/sfx_laser01.wav')
	}
}

/**
 * Handle kick students sound event
 */
function handleKickStudentsSound(webIo) {
	return async () => {
		let player = createSimPlayer(webIo);
		player.play('./sfx/sfx_splash01.wav')
	}
}

/**
 * Handle end class sound event
 */
function handleEndClassSound(webIo) {
	return async () => {
		let player = createSimPlayer(webIo);
		player.play('./sfx/sfx_explode01.wav')
	}
}

/**
 * Handle timer sound event
 */
function handleTimerSound(webIo) {
	return async () => {
		let player = createSimPlayer(webIo);
		player.play('./sfx/alarmClock.mp3')
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
