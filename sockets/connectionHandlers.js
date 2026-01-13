/**
 * Socket event handlers for connection and disconnection
 */

const { fill, gradient } = require('../utils/pixelOps');
const { displayBoard, getStringColumnLength } = require('../utils/displayUtils');
const { playSound } = require('../utils/soundUtils');

/**
 * Handle connection error
 */
function handleConnectError(socket, boardIntervals) {
	return (error) => {
		if (error.message == 'xhr poll error') console.log('no connection');
		else console.log(error.message);

		const { pixels, config, ws281x } = require('../state');
		
		let state = require('../state');
		state.connected = false

		boardIntervals = boardIntervals.filter(boardInterval => {
			clearInterval(boardInterval.interval);
			return false
		})

		fill(pixels, 0x000000)
		ws281x.render()

		setTimeout(() => {
			socket.connect()
		}, 5000)
	}
}

/**
 * Handle connection
 */
function handleConnect(socket, boardIntervals) {
	return () => {
		console.log('connected')

		const { pixels, config, ws281x } = require('../state');
		
		let state = require('../state');
		state.connected = true

		socket.emit('getActiveClass', config.api);

		let display = displayBoard(pixels, config.formbarUrl.split('://')[1], 0xFFFFFF, 0x000000, config, boardIntervals, ws281x)
		if (!display) return
		boardIntervals.push(display)

	const { player } = require('../utils/soundUtils');
	if (player) {
		try {
			player.play('./sfx/sfx_bootup02.wav', (err) => {
				if (err) console.error('Error playing bootup sound:', err.message);
			});
		} catch (err) {
			console.error('Error playing bootup sound:', err.message);
		}
	}
	}
}

/**
 * Handle class change
 */
function handleSetClass(socket, boardIntervals) {
	return (userClassId) => {
		const { pixels, config, ws281x } = require('../state');
		
		if (userClassId == null) {
			fill(pixels, 0x000000, 0, config.barPixels)

			let display = displayBoard(pixels, config.formbarUrl.split('://')[1], 0xFFFFFF, 0x000000, config, boardIntervals, ws281x)
			if (!display) return
			boardIntervals.push(display)

			ws281x.render()
		} else {
			socket.emit('classUpdate')
			socket.emit('vbTimer')
		}
		console.log('Moved to class id:', userClassId);
		
		let state = require('../state');
		state.classId = userClassId;
	}
}

module.exports = {
	handleConnectError,
	handleConnect,
	handleSetClass
};
