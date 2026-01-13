/**
 * Pixel operations - fill, gradient, and display functions
 */

/**
 * Fills a portion of the pixels array with a specified color.
 * @param {Uint32Array} pixels - The pixels array
 * @param {string} color - The color to fill the pixels with.
 * @param {number} [start=0] - The starting index from where to start filling the pixels.
 * @param {number} [length=pixels.length] - The number of pixels to fill with the color.
 */
function fill(pixels, color, start = 0, length = pixels.length) {
	if (length >= pixels.length) length = pixels.length - start;

	for (let i = 0; i < length; i++) {
		pixels[i + start] = color;
	}
}

/**
 * Generates a gradient from a start color to an end color over a certain length.
 * @param {Uint32Array} pixels - The pixels array
 * @param {number} startColor - The start color in hexadecimal format.
 * @param {number} endColor - The end color in hexadecimal format.
 * @param {number} [start=0] - The start position of the gradient.
 * @param {number} [length=pixels.length] - The length of the gradient.
 */
function gradient(pixels, startColor, endColor, start = 0, length = pixels.length) {
	const { hexToRgb, rgbToHex } = require('./colorUtils');
	
	startColor = hexToRgb(startColor)
	endColor = hexToRgb(endColor)

	let currentColor = startColor

	length = Math.floor(length)
	if (length >= pixels.length - start) length = pixels.length - start

	let stepColor = startColor.map((start, i) => (endColor[i] - start) / (length - 1))

	for (let i = 0; i < length; i++) {
		currentColor = [
			Math.round(startColor[0] + stepColor[0] * i),
			Math.round(startColor[1] + stepColor[1] * i),
			Math.round(startColor[2] + stepColor[2] * i)
		]

		pixels[i + start] = rgbToHex(currentColor)
	}
}

module.exports = {
	fill,
	gradient
};
