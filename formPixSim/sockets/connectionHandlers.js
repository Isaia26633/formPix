/**
 * Socket connection handlers
 */

const logger = require('../utils/logger');
const { fill, gradient } = require('../utils/pixelOps');
const { displayBoard, getStringColumnLength } = require('../utils/displayUtils');

/**
 * Handle connection error
 */
function handleConnectError(socket, boardIntervals) {
	return (error) => {
		if (error.message == 'xhr poll error') {
			logger.warn('FormBar connection lost: xhr poll error');
		} else {
			logger.error('FormBar connection error', { error: error.message });
		}

		const state = require('../state');
		state.connected = false

		boardIntervals = boardIntervals.filter(boardInterval => {
			clearInterval(boardInterval.interval);
			return false
		})

		const { pixels, config, ws281x } = state;
		fill(pixels, 0x000000)
		ws281x.render()

		setTimeout(() => {
			socket.connect()
		}, 5000)
	}
}

/**
 * Handle connect
 */
function handleConnect(socket, boardIntervals) {
	return () => {
		const state = require('../state');
		logger.info('Connected to FormBar successfully');

		state.connected = true

		socket.emit('getActiveClass', state.config.api);

		const { pixels, config, ws281x } = state;
		let display = displayBoard(pixels, config.formbarUrl.split('://')[1], 0xFFFFFF, 0x000000, config, boardIntervals, ws281x)
		if (!display) return
		boardIntervals.push(display)
	}
}

/**
 * Handle set class
 */
function handleSetClass(socket, boardIntervals) {
	return (userClassId) => {
		const state = require('../state');
		
		if (userClassId == null) {
			const { pixels, config, ws281x } = state;
			fill(pixels, 0x000000, 0, config.barPixels)

			let display = displayBoard(pixels, config.formbarUrl.split('://')[1], 0xFFFFFF, 0x000000, config, boardIntervals, ws281x)
			if (!display) return
			boardIntervals.push(display)

			ws281x.render()
		} else {
			socket.emit('classUpdate')
			socket.emit('vbTimer')
		}
		logger.info('Moved to class', { classId: userClassId });
		state.classId = userClassId;
	}
}

module.exports = {
	handleConnectError,
	handleConnect,
	handleSetClass
};
