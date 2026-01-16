/**
 * Controllers for system info routes
 */

/**
 * GET /api/info - Get information about the LED display system
 */
async function getInfoController(req, res) {
	try {
		const { config, pixels, BOARD_WIDTH, BOARD_HEIGHT } = require('../state');
		
		res.status(200).json({
			barPixels: config.barPixels,
			boards: config.boards,
			boardWidth: BOARD_WIDTH,
			boardHeight: BOARD_HEIGHT,
			totalPixels: pixels.length,
			brightness: config.brightness,
			stripType: config.stripType
		});
	} catch (err) {
		res.status(500).json({ error: 'There was a server error try again' });
	}
}

module.exports = {
	getInfoController
};
