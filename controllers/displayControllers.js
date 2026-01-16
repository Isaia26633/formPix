/**
 * Controllers for display and text routes
 */

const logger = require('../utils/logger');
const { textToHexColor } = require('../utils/colorUtils');
const { displayBoard } = require('../utils/displayUtils');

/**
 * POST /api/say - Display text on the LED board
 */
async function sayController(req, res) {
	try {
		const { pixels, config, boardIntervals, ws281x } = require('../state');
		
		let { text, textColor, backgroundColor } = req.query

		if (!text) {
			res.status(400).json({ error: 'You did not provide any text' })
			return
		}
		if (!textColor) {
			textColor = '#FFFFFF' // default to white
		}
		if (!backgroundColor) {
			backgroundColor = '#000000' // default to black
		}

		textColor = textToHexColor(textColor)
		backgroundColor = textToHexColor(backgroundColor)

		if (typeof textColor == 'string') {
			res.status(400).json({ error: textColor })
			return
		}
		if (textColor instanceof Error) throw textColor
		if (typeof backgroundColor == 'string') {
			res.status(400).json({ error: backgroundColor })
			return
		}
		if (backgroundColor instanceof Error) throw backgroundColor

		let display = displayBoard(pixels, text, textColor, backgroundColor, config, boardIntervals, ws281x)
		if (!display) {
			logger.error('Display board failed in sayController', { text });
			res.status(500).json({ error: 'There was a server error try again' })
			return
		}
		boardIntervals.push(display)

		logger.info('Say controller completed', { text, textColor: textColor.toString(16), backgroundColor: backgroundColor.toString(16) });
		res.status(200).json({ message: 'ok' })
	} catch (err) {
		logger.error('Error in sayController', { error: err.message, stack: err.stack, query: req.query });
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

module.exports = {
	sayController
};
