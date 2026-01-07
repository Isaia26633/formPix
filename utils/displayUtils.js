/**
 * Display and text rendering functions
 */

const { letters } = require('../../letters');

const PIXELS_PER_LETTER = 5;
const BOARD_HEIGHT = 8;

/**
 * Shows a string on the board
 * @param {Array} boardPixels - The board pixels
 * @param {number} startFrame - Starting frame
 * @param {number} textColor - Text color in hex
 * @param {number} backgroundColor - Background color in hex
 * @param {number} startPixel - Starting pixel index
 * @param {number} endPixel - Ending pixel index
 */
function showString(boardPixels, startFrame, textColor, backgroundColor, pixels, startPixel, endPixel) {
	const { fill } = require('./pixelOps');
	
	let newBoardPixels = structuredClone(boardPixels);
	let currentPixel = startPixel;
	let currentColumn = startFrame;
	let maxColumns = newBoardPixels.length;

	fill(pixels, 0x000000, startPixel, endPixel - startPixel);

	for (let i = 0; i < newBoardPixels.length; i++) {
		if (startFrame % 2 === i % 2) {
			newBoardPixels[i] = newBoardPixels[i].reverse();
		}
	}

	for (let i = 0; i < maxColumns; i++) {
		let col = newBoardPixels[currentColumn];

		for (let pixel of col) {
			pixels[currentPixel] = pixel ? textColor : backgroundColor;
			currentPixel++;

			if (currentPixel >= endPixel) return
		}

		currentColumn = (currentColumn + 1) % newBoardPixels.length;
	}
}

/**
 * Calculates the length of a string column based on the number of characters in the text.
 * @param {string} text - The input text.
 * @returns {number} The amount of columns in the string.
 */
function getStringColumnLength(text) {
	return (text.length * (PIXELS_PER_LETTER + 1))
}

/**
 * Display a string on a LED board.
 * @param {Uint32Array} pixels - The pixels array
 * @param {string} string - The string to display.
 * @param {number} textColor - The color of the text.
 * @param {number} backgroundColor - The color of the background.
 * @param {Object} config - Configuration object
 * @param {Array} boardIntervals - Array of active board intervals
 * @param {number} [startColumn=0] - The starting column to display the string.
 * @param {number} [endColumn] - The ending column to display the string.
 */
function displayBoard(pixels, string, textColor, backgroundColor, config, boardIntervals, startColumn = 0, endColumn = null) {
	const ws281x = require('rpi-ws281x-native');
	
	if (endColumn === null) {
		endColumn = config.boards * 32;
	}

	string = string.toLowerCase();
	let stringColumnLength = getStringColumnLength(string);

	let startPixel = config.barPixels + startColumn * BOARD_HEIGHT

	if (stringColumnLength + startColumn < endColumn)
		endColumn = stringColumnLength + startColumn

	let endPixel = config.barPixels + endColumn * BOARD_HEIGHT

	let boardPixels = [Array(8).fill(0)];

	for (let boardInterval of boardIntervals) {
		if (!boardInterval) continue

		if (
			string == boardInterval.string &&
			startColumn == boardInterval.startColumn &&
			endColumn == boardInterval.endColumn
		) return
	}

	boardIntervals = boardIntervals.filter(boardInterval => {
		if (
			startColumn < boardInterval.endColumn &&
			endColumn > boardInterval.startColumn
		) {
			clearInterval(boardInterval.interval);
			return false
		} else return true
	})

	for (let letter of string) {
		if (!letters[letter]) continue

		let letterImage = letters[letter].map(arr => arr.slice());

		for (let col of letterImage) {
			boardPixels.push(col);
		}

		boardPixels.push(Array(8).fill(0));
	}

	if (boardPixels.length - 1 <= endColumn - startColumn) {
		showString(boardPixels, 0, textColor, backgroundColor, pixels, startPixel, endPixel);
		ws281x.render();

		return {
			string,
			startColumn,
			endColumn
		}
	} else {
		for (let i = 0; i < 2 * 6 + 1; i++) {
			boardPixels.unshift([0, 0, 0, 0, 0, 0, 0, 0]);
		}

		let startFrame = 0;

		return {
			string,
			interval: setInterval(() => {
				showString(boardPixels, startFrame, textColor, backgroundColor, pixels, startPixel, endPixel);
				startFrame = (startFrame + 1) % boardPixels.length;
				ws281x.render();
			}, 200),
			startColumn,
			endColumn
		}
	}
}

module.exports = {
	showString,
	getStringColumnLength,
	displayBoard
};
