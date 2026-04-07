/**
 * Controllers for display and text routes
 */

const logger = require('../utils/logger');
const { textToHexColor } = require('../utils/colorUtils');
const { displayBoard } = require('../utils/displayUtils');
const { text } = require('express');

/**
 * POST /api/say - Display text on the LED board
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function sayController(req, res) {
	try {
		logger.info('API Call: /api/say', { query: req.query });

		const state = require('../state');
		const { pixels, config, boardIntervals, ws281x } = state;

		let { text, textColor, backgroundColor, scroll } = req.query;

		let API_KEY = req.headers.api

		let reqOptions =
		{
			method: 'GET',
			headers: {
				'API': API_KEY,
				'Content-Type': 'application/json'
			}
		};

		const FORMBAR_URL = (
			process.env.formbarUrl
			?? process.env.FORMBAR_URL
			?? state.config.formbarUrl
			?? ''
		).replace(/\/+$/, '');

		fetch(`${FORMBAR_URL}/api/me`, reqOptions)
			.then((response) => {
				// Convert received data to JSON
				return response.json();
			})
			.then((data) => {
				// Log the data if the request is successful
				console.log(data);
			})
			.catch((err) => {
				// If there's a problem, handle it...
				if (err) console.log('connection closed due to errors', err);
			});

		if (!text) {
			res.status(400).json({ source: 'Formpix', error: 'You did not provide any text' })
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
			res.status(400).json({ source: 'Formpix', error: textColor })
			return
		}
		if (textColor instanceof Error) throw textColor
		if (typeof backgroundColor == 'string') {
			res.status(400).json({ source: 'Formpix', error: backgroundColor })
			return
		}
		if (backgroundColor instanceof Error) throw backgroundColor

		let display = displayBoard(pixels, text, textColor, backgroundColor, config, boardIntervals, ws281x, 0, null, scroll ? parseInt(scroll) : 100)

		if (!display) {
			res.status(500).json({ source: 'Formpix', error: 'There was a server error try again' })
			return
		}
		boardIntervals.push(display)

		// Store the current display message
		state.currentDisplayMessage = text; state.lastDisplayUpdate = new Date().toISOString();
		res.status(200).json({ message: 'ok' })
	} catch (err) {
		console.error('Error in sayController:', err);
		res.status(500).json({ source: 'Formpix', error: 'There was a server error try again' })
	}
}

/**
 * GET /api/getDisplay - Get the current message displayed on the LED board
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>} Resolves when the response is sent.
 */
async function getDisplayController(req, res) {
	try {
		logger.info('API Call: /api/getDisplay');

		const state = require('../state');

		// Get default message (formbar URL without protocol)
		const defaultMessage = state.config.formbarUrl ? state.config.formbarUrl.split('://')[1] : '';

		const displayInfo = {
			message: state.currentDisplayMessage || defaultMessage,
			textColor: state.config.textColor || '#FFFFFF',
			backgroundColor: state.config.backgroundColor || '#000000',
			scroll: state.config.scroll || 100,
			textLength: state.currentDisplayMessage ? state.currentDisplayMessage.length : 0,
			isActive: !!state.currentDisplayMessage,
			timestamp: state.lastDisplayUpdate || null,
			brightness: state.config.brightness || 100,
			isScrolling: state.config.scroll && state.currentDisplayMessage && state.currentDisplayMessage.length > (state.config.width / 6) // approximate char width
		};

		res.status(200).json({
			source: 'Formpix',
			display: displayInfo
		});

	} catch (err) {
		console.error('Error in getDisplayController:', err);
		res.status(500).json({ source: 'Formpix', error: 'There was a server error try again' });
	}
}

module.exports = {
	sayController,
	getDisplayController
};