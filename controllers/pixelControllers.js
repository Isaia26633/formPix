/**
 * Controllers for LED pixel routes
 */

const { textToHexColor } = require('../utils/colorUtils');
const { fill, gradient } = require('../utils/pixelOps');
const { getPixelNumber } = require('../utils/pixelUtils');

/**
 * POST /api/percentage - Fill a percentage of the LED strip with a color
 */
function percentageController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');

		let { percent, color } = req.query
		color = textToHexColor(color)
		percent = Number(percent)
		if (typeof color == 'string') {
			res.status(400).json({ error: color })
			return
		}
		if (color instanceof Error) throw color
		if (isNaN(percent) || percent < 0 || percent > 100) {
			res.status(400).json({ error: 'percent must be a number between 0 and 100' })
			return
		}
		let length = Math.floor((percent / 100) * pixels.length)
		fill(pixels, color, 0, length)
		ws281x.render()
		res.status(200).json({ message: 'ok' })
	} catch (err) {
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

/**
 * POST /api/fillByPercent - Fill a percentage of the LED strip with a fill color and background color
 */
async function fillByPercentController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');

		let { percent, fillColor, bgColor, length = config.barPixels } = req.query;

		fillColor = textToHexColor(fillColor);
		bgColor = textToHexColor(bgColor);

		// Validate fill colors
		if (typeof fillColor == 'string') {
			res.status(400).json({ error: fillColor });
			return;
		}
		if (fillColor instanceof Error) throw fillColor;

		if (typeof bgColor == 'string') {
			res.status(400).json({ error: bgColor });
			return;
		}
		if (bgColor instanceof Error) throw bgColor;

		// Validate percent
		percent = Number(percent);
		if (isNaN(percent) || percent < 0 || percent > 100) {
			res.status(400).json({ error: 'percent must be a number between 0 and 100' });
			return;
		}

		// Validate length
		length = Number(length);
		if (isNaN(length) || !Number.isInteger(length)) {
			res.status(400).json({ error: 'length must be an integer' });
			return;
		}

		// Use only the barPixels strip which starts at 0
		const startPos = 0;
		const stripLength = config.barPixels;

		// Make sure to clear the strip
		fill(pixels, 0x000000, startPos, stripLength);

		length = Math.min(length, stripLength);

		// Calculate length based on percent given
		let fillLength = Math.floor((percent / 100) * length);

		// Fill the strip
		fill(pixels, bgColor, startPos, length);
		fill(pixels, fillColor, startPos, fillLength);

		ws281x.render();
		res.status(200).json({ message: 'ok' });
	} catch (err) {
		res.status(500).json({ error: 'There was a server error try again' });
	}
}

/**
 * POST /api/fill - Fill LED strip with a color
 */
async function fillController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');

		let { color, start = 0, length = pixels.length } = req.query

		color = textToHexColor(color)

		if (typeof color == 'string') {
			res.status(400).json({ error: color })
			return
		}
		if (color instanceof Error) throw color

		if (isNaN(start) || !Number.isInteger(Number(start))) {
			res.status(400).json({ error: 'start must be an integer' })
			return
		}
		if (isNaN(length) || !Number.isInteger(Number(length))) {
			res.status(400).json({ error: 'length must be an integer' })
			return
		}

		start = Number(start)
		length = Number(length)

		fill(pixels, color, start, length)
		ws281x.render()
		res.status(200).json({ message: 'ok' })
	} catch (err) {
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

/**
 * POST /api/gradient - Fill LED strip with a gradient
 */
async function gradientController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');

		let { startColor, endColor, start = 0, length = pixels.length } = req.query

		if (!startColor) {
			res.status(400).json({ error: 'missing startColor' })
			return
		}
		if (!endColor) {
			res.status(400).json({ error: 'missing endColor' })
			return
		}

		startColor = textToHexColor(startColor)

		if (typeof startColor == 'string') {
			res.status(400).json({ error: startColor })
			return
		}
		if (startColor instanceof Error) throw startColor

		endColor = textToHexColor(endColor)

		if (typeof endColor == 'string') {
			res.status(400).json({ error: endColor })
			return
		}
		if (endColor instanceof Error) throw endColor

		if (isNaN(start) || !Number.isInteger(Number(start))) {
			res.status(400).json({ error: 'start must be an integer' })
			return
		}
		if (isNaN(length) || !Number.isInteger(Number(length))) {
			res.status(400).json({ error: 'length must be an integer' })
			return
		}

		start = Number(start)
		length = Number(length)

		gradient(pixels, startColor, endColor, start, length)
		ws281x.render()
		res.status(200).json({ message: 'ok' })
	} catch (err) {
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

/**
 * POST /api/setPixel - Set a single pixel color
 */
async function setPixelController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');

		let { pixel, color } = req.query

		color = textToHexColor(color)

		if (typeof color == 'string') {
			res.status(400).json({ error: color })
			return
		}
		if (color instanceof Error) throw color

		let pixelNumber = getPixelNumber(pixel, config.barPixels, config.boards)

		if (typeof pixelNumber == 'string') {
			res.status(400).json({ error: pixelNumber })
			return
		}
		if (pixelNumber instanceof Error) throw pixelNumber

		pixels[pixelNumber] = color

		ws281x.render()

		res.status(200).json({ message: 'ok' })
	} catch (err) {
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

/**
 * POST /api/setPixels - Set multiple pixel colors
 */
async function setPixelsController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');
		const { safeJsonParse } = require('../utils/colorUtils');

		let inputPixels = req.query.pixels
		let tempPixels = structuredClone(pixels)

		if (!inputPixels) {
			res.status(400).json({ error: 'You did not provide any pixels' })
			return
		}

		inputPixels = safeJsonParse(inputPixels)

		if (typeof inputPixels == 'string') {
			res.status(400).json({ error: inputPixels })
			return
		}
		if (inputPixels instanceof Error) throw inputPixels

		for (let inputPixel of inputPixels) {
			let color = textToHexColor(inputPixel.color)
			let pixelNumber

			if (typeof color == 'string') {
				res.status(400).json({ error: color })
				return
			}
			if (color instanceof Error) throw color

			pixelNumber = getPixelNumber(inputPixel.pixelNumber, config.barPixels, config.boards)

			if (typeof pixelNumber == 'string') {
				res.status(400).json({ error: pixelNumber })
				return
			}
			if (pixelNumber instanceof Error) throw pixelNumber

			tempPixels[pixelNumber] = color
		}

		pixels.set(tempPixels)

		ws281x.render()

		res.status(200).json({ message: 'ok' })
	} catch (err) {
		// console.log(err);
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

module.exports = {
	fillController,
	fillByPercentController,
	gradientController,
	setPixelController,
	setPixelsController
};