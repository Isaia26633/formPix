/**
 * Pixel operations - fill, gradient, and display functions
 */

const { hexToRgb, rgbToHex } = require('./colorUtils');

const GAMMA = 2.8;

// Precomputed gamma correction lookup table for 0-255 channel values.
// This avoids expensive Math.pow calls in tight per-pixel loops.
const GAMMA_LUT = (() => {
	const table = new Array(256);
	for (let i = 0; i < 256; i++) {
		// Match previous behaviour: round(Math.pow(i / 255, GAMMA) * 255)
		// Values are clamped implicitly by the 0-255 domain.
		table[i] = Math.round(Math.pow(i / 255.0, GAMMA) * 255);
	}
	return table;
})();

/**
 * Applies gamma correction to a single channel value (0-255).
 * Corrects for the non-linear brightness perception of human eyes
 * vs the linear output of WS2812 LEDs, making colors true to their hex values.
 * @param {number} value - The channel value (0-255).
 * @returns {number} The gamma corrected channel value.
 */
function gammaCorrect(value) {
	// Clamp to the 0-255 table range and coerce to integer index.
	let v = value;
	if (v < 0) v = 0;
	else if (v > 255) v = 255;
	v = v | 0;
	return GAMMA_LUT[v];
}

/**
 * Applies gamma correction to a hex color value.
 * @param {number} color - The hex color value.
 * @returns {number} The gamma corrected hex color value.
 */
function applyGamma(color) {
	const r = gammaCorrect((color >> 16) & 255);
	const g = gammaCorrect((color >> 8) & 255);
	const b = gammaCorrect(color & 255);
	return (r << 16) | (g << 8) | b;
}

/**
 * Fills a portion of the pixels array with a specified color.
 * @param {Uint32Array} pixels - The pixels array
 * @param {string} color - The color to fill the pixels with.
 * @param {number} [start=0] - The starting index from where to start filling the pixels.
 * @param {number} [length=pixels.length] - The number of pixels to fill with the color.
 */
function fill(pixels, color, start = 0, length = pixels.length) {
	if (length >= pixels.length) length = pixels.length - start;

	const correctedColor = applyGamma(color);
	for (let i = 0; i < length; i++) {
		pixels[i + start] = correctedColor;
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
	startColor = hexToRgb(startColor);
	endColor = hexToRgb(endColor);

	let currentColor = startColor;

	length = Math.floor(length);
	if (length >= pixels.length - start) length = pixels.length - start;
	if (length <= 0) return;

	const stepColor = startColor.map((start, i) => (endColor[i] - start) / (length - 1 || 1));

	for (let i = 0; i < length; i++) {
		currentColor = [
			Math.round(startColor[0] + stepColor[0] * i),
			Math.round(startColor[1] + stepColor[1] * i),
			Math.round(startColor[2] + stepColor[2] * i)
		];

		pixels[i + start] = rgbToHex(currentColor.map(gammaCorrect));
	}
}

module.exports = {
	fill,
	gradient,
	gammaCorrect,
	applyGamma
};
