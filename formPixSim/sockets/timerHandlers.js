/**
 * Socket event handler for timer updates
 */

const logger = require('../utils/logger');
const { fill } = require('../utils/pixelOps');

/**
 * Handle timer updates
 */
function handleVBTimer() {
	return (newTimerData) => {
		const state = require('../state');
		const { pixels, config, ws281x, socket } = state;
		
		if (!newTimerData) return

		if (!newTimerData.active) {
			if (state.timerData.active) {
				logger.info('Timer ended');
				fill(pixels, 0x000000, 0, config.barPixels)
				ws281x.render()

				socket.emit('classUpdate')
				
				state.timerData = newTimerData
			}
			return
		}

		logger.debug('Timer update', { timeLeft: newTimerData.timeLeft, startTime: newTimerData.startTime });

		if (newTimerData.timeLeft > 0) {
			let timeLeftPixels = Math.round(config.barPixels * (newTimerData.timeLeft / newTimerData.startTime))
			fill(pixels, 0x0000ff, 0, timeLeftPixels)
			fill(pixels, 0xffffff, timeLeftPixels, config.barPixels - timeLeftPixels)
		} else {
			fill(pixels, 0xff0000, 0, config.barPixels)
		}

		state.timerData = newTimerData
		ws281x.render()
	}
}

module.exports = {
	handleVBTimer
};
