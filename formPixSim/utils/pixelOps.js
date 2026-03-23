/**
 * Pixel operations - fill and gradient functions
 */

const { hexToRgb } = require('./colorUtils');

const GAMMA = 2.8;

// Precomputed gamma correction lookup table for 0-255 channel values.
// This keeps the sim behaviour consistent with the main app while
// avoiding per-channel Math.pow in inner loops.
const GAMMA_LUT = (() => {
	const table = new Array(256);
	for (let i = 0; i < 256; i++) {
		table[i] = Math.round(Math.pow(i / 255.0, GAMMA) * 255);
	}
	return table;
})();

/**
 * Apply gamma correction to a single color channel.
 * @param {number} value - Channel value between 0 and 255.
 * @returns {number} Gamma-corrected channel value.
 */
function gammaCorrect(value) {
	let v = value;
	if (v < 0) v = 0;
	else if (v > 255) v = 255;
	v = v | 0;
	return GAMMA_LUT[v];
}

/**
 * Fills a portion of the pixels array with a specified color.
 * @param {Uint32Array} pixels - The pixels array
 * @param {number} color - The color to fill the pixels with.
 * @param {number} [start=0] - The starting index from where to start filling the pixels.
 * @param {number} [length=pixels.length] - The number of pixels to fill with the color.
 * @returns {void}
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
 * @returns {void}
 */
function gradient(pixels, startColor, endColor, start = 0, length = pixels.length) {
	const startRgb = hexToRgb(startColor);
	const endRgb = hexToRgb(endColor);

	length = Math.floor(length);
	if (start + length > pixels.length) length = pixels.length - start;
	if (length <= 0) return;

	const rStep = length > 1 ? (endRgb[0] - startRgb[0]) / (length - 1) : 0;
	const gStep = length > 1 ? (endRgb[1] - startRgb[1]) / (length - 1) : 0;
	const bStep = length > 1 ? (endRgb[2] - startRgb[2]) / (length - 1) : 0;

	for (let i = 0; i < length; i++) {
		const r = gammaCorrect(Math.round(startRgb[0] + rStep * i));
		const g = gammaCorrect(Math.round(startRgb[1] + gStep * i));
		const b = gammaCorrect(Math.round(startRgb[2] + bStep * i));
		pixels[i + start] = (r << 16) | (g << 8) | b;
	}
}

module.exports = {
	fill,
	gradient,
	gammaCorrect
};
