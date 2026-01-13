/**
 * Socket event handler for timer updates
 */

const { fill } = require('../utils/pixelOps');
const ws281x = require('rpi-ws281x-native');

/**
 * Handle timer updates
 */
function handleVBTimer() {
	return (newTimerData) => {
		const { pixels, config, timerData } = require('../state');
		
		if (!newTimerData) return

		if (!newTimerData.active) {
			if (timerData.active) {
				fill(pixels, 0x000000, 0, config.barPixels)
				ws281x.render()

				const socket = require('../state').socket;
				socket.emit('classUpdate')
				
				let state = require('../state');
				state.timerData = newTimerData
			}
			return
		}

		if (newTimerData.timeLeft > 0) {
			let timeLeftPixels = Math.round(config.barPixels * (newTimerData.timeLeft / newTimerData.startTime))
			fill(pixels, 0x0000ff, 0, timeLeftPixels)
			fill(pixels, 0xffffff, timeLeftPixels, config.barPixels - timeLeftPixels)
		} else {
			fill(pixels, 0xff0000, 0, config.barPixels)
		}

		let state = require('../state');
		state.timerData = newTimerData
		ws281x.render()
	}
}

module.exports = {
	handleVBTimer
};
