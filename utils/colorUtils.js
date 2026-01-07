/**
 * Color utility functions for converting and validating colors
 */

/**
 * Converts a hexadecimal color value to an RGB array.
 * @param {number} hex - The hexadecimal color value.
 * @returns {Array.<number>} The RGB color value as an array.
 */
function hexToRgb(hex) {
	return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

/**
 * Converts an RGB array to a hexadecimal color value.
 * @param {Array.<number>} rgb - The RGB color value as an array.
 * @returns {number} The hexadecimal color value.
 */
function rgbToHex(rgb) {
	return ((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]);
}

/**
 * This function safely parses a JSON string and returns the parsed object.
 * @param {string} string - The JSON string to parse.
 * @returns {object|string} - The parsed object or an error message.
 */
function safeJsonParse(string) {
	try {
		if (typeof string !== 'string') return "Input must be a string";
		let value = JSON.parse(string);
		if (typeof value === 'object') return value;
		else return "Parsed value is not an object";
	} catch (err) {
		if (err.message.toLowerCase().includes('json')) {
			return "Input is not a valid JSON string";
		} else throw err;
	}
}

/**
 * Converts a color from text format to hexadecimal format.
 * @param {string} color - The input can be a string representing a color in hexadecimal format or a JSON string representing a color in RGB format.
 * @returns {number|string} - The color in hexadecimal format, or an error message if the input is not valid.
 */
function textToHexColor(color) {
	if (typeof color != 'string') return "Color must be a string";

	if (color.startsWith('#')) {
		color = color.slice(1);
		if (color.length != 6) return "Hex color must be 6 characters long";
		return Number.parseInt(color, 16)
	}

	color = safeJsonParse(color);
	if (typeof color == 'string') return color;
	if (color instanceof Error) throw color;

	let red, green, blue;
	keys = Object.keys(color)

	if (keys.every(item => ['red', 'green', 'blue'].includes(item))) {
		red = color.red
		green = color.green
		blue = color.blue
	} else if (keys.every(item => ['r', 'g', 'b'].includes(item))) {
		red = color.r
		green = color.g
		blue = color.b
	} else return "Invalid color keys";

	if ([red, green, blue].some(item =>
		item < 0 || item > 255 || !Number.isInteger(item)
	)) return "Color values must be integers between 0 and 255";

	return rgbToHex([red, green, blue])
}

module.exports = {
	hexToRgb,
	rgbToHex,
	safeJsonParse,
	textToHexColor
};
