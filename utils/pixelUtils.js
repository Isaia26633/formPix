/**
 * Pixel utility functions for pixel manipulation and validation
 */

const { safeJsonParse } = require('./colorUtils');

const BOARD_WIDTH = 32;
const BOARD_HEIGHT = 8;

/**
 * Validates the pixel object and calculates its position on the board.
 * @param {Object} pixel - The pixel object with 'x' and 'y' properties.
 * @param {number} barPixels - The number of bar pixels from config
 * @param {number} boards - The number of boards from config
 * @returns {number|string} The calculated pixel position or an error message
 */
function validateAndCalculatePixel(pixel, barPixels, boards) {
	if (Object.keys(pixel).every(item => !['x', 'y'].includes(item))) return 'invalid pixel format';

	let x = pixel.x;
	let y = pixel.y;

	if (!x && x != 0) return 'no x';
	if (!y && y != 0) return 'no y';
	if (typeof x != 'number') return 'x not a number';
	if (typeof y != 'number') return 'y not a number';
	if (!Number.isInteger(x)) return 'x not an integer';
	if (!Number.isInteger(y)) return 'y not an integer';
	if (x < 0 || x >= BOARD_WIDTH * boards) return 'x out of bounds';
	if (y < 0 || y >= BOARD_HEIGHT) return 'y out of bounds';

	let pixelNum = barPixels;
	pixelNum += x * BOARD_HEIGHT;

	if (x % 2 == 1) {
		pixelNum += BOARD_HEIGHT - 1;
		pixelNum -= y;
	} else pixelNum += y;

	return pixelNum;
}

/**
 * Parses the pixel input and returns the pixel number.
 * @param {number|string|Object} pixel - The pixel input
 * @param {number} barPixels - The number of bar pixels from config
 * @param {number} boards - The number of boards from config
 * @returns {number|string} - The pixel number or an error message
 */
function getPixelNumber(pixel, barPixels, boards) {
	if (!isNaN(pixel)) {
		if (typeof pixel == 'number') return pixel;
		else return Number(pixel);
	} else if (typeof pixel == 'string') {
		pixel = safeJsonParse(pixel);
		if (typeof pixel == 'string') return pixel
		if (pixel instanceof Error) throw pixel
		return validateAndCalculatePixel(pixel, barPixels, boards);
	} else if (typeof pixel == 'object' && !Array.isArray(pixel)) {
		return validateAndCalculatePixel(pixel, barPixels, boards);
	}
}

module.exports = {
	validateAndCalculatePixel,
	getPixelNumber,
	BOARD_WIDTH,
	BOARD_HEIGHT
};
