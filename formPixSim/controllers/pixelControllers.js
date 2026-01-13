/**
 * Controllers for LED pixel routes
 */

const { textToHexColor } = require('../utils/colorUtils');
const { fill, gradient } = require('../utils/pixelOps');
const { getPixelNumber } = require('../utils/pixelUtils');

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
		console.log(err);
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

module.exports = {
	fillController,
	gradientController,
	setPixelController,
	setPixelsController
};
