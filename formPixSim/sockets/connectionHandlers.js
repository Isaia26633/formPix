/**
 * Socket connection handlers
 */

const { fill, gradient } = require('../utils/pixelOps');
const { displayBoard, getStringColumnLength } = require('../utils/displayUtils');
const state = require('../state');
const logger = require('../utils/logger');


/**
 * Handle connection error
 */
function handleConnectError(socket, boardIntervals) {
	return (error) => {
		if (error.message == 'xhr poll error') console.log('no connection');
		else console.log(error.message);

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

		state.connected = true

		socket.emit('getActiveClass', state.config.api);

		const { pixels, config, ws281x } = state;
		let display = displayBoard(pixels, config.formbarUrl.split('://')[1], 0xFFFFFF, 0x000000, config, boardIntervals, ws281x, 0, null, 100)
		if (!display) return
		boardIntervals.push(display)	
	// Set timestamp for default message display
	state.lastDisplayUpdate = new Date().toISOString();	}
}

/**
 * Request active class update
 */
function handleRequestClassUpdate(socket) {
	return () => {
		socket.emit('getActiveClass', state.config.api);
	}
}


/**
 * Handle set class
 */
function handleSetClass(socket, boardIntervals) {
	return (userClassId) => {
		state.connected = true

		if (userClassId == null) {
			const { pixels, config, ws281x } = state;
			fill(pixels, 0x000000, 0, config.barPixels)

			logger.info('No active class - cleared display');

			let display = displayBoard(pixels, config.formbarUrl.split('://')[1], 0xFFFFFF, 0x000000, config, boardIntervals, ws281x, 0, null, 100)
			if (!display) return
			boardIntervals.push(display)

			ws281x.render()
		} else {
			socket.emit('classUpdate')
			socket.emit('vbTimer')
			if (!state.classRefreshed) {
				state.classRefreshed = true;

				logger.info(`Class update received - New class ID: ${userClassId}`);
				
				handleRequestClassUpdate(socket)();
			}
		}

		state.classId = userClassId;
	}
}

module.exports = {
	handleConnectError,
	handleConnect,
	handleSetClass,
	handleRequestClassUpdate
};