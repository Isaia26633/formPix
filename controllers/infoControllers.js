/**
 * Controllers for system info routes
 */

const logger = require('../utils/logger');

/**
 * GET /api/info - Get information about the LED display system
 */
async function getInfoController(req, res) {
	try {
		const { config, pixels, BOARD_WIDTH, BOARD_HEIGHT } = require('../state');
		
		res.status(200).json({
			boards: config.boards,
			boardWidth: BOARD_WIDTH,
			boardHeight: BOARD_HEIGHT,
			totalPixels: pixels.length,
			brightness: config.brightness,
			stripPixels: config.barPixels,
			stripType: config.stripType
		});
	} catch (err) {
		logger.error('Error in getInfoController', { error: err.message, stack: err.stack });
		res.status(500).json({ source: 'Formpix', error: 'There was a server error try again' });
	}
}

module.exports = {
	getInfoController
};
