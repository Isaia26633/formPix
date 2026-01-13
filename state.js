/**
 * Global application state
 */

const fs = require('fs');
const ws281x = require('rpi-ws281x-native');
const { loadSounds } = require('./utils/soundUtils');
const env = require('dotenv');
env.config();


// Load config from the .env
const config = {
    formbarUrl: process.env.formbarUrl || '',
    api: process.env.api || '',
    brightness: parseInt(process.env.brightness) || 0,
    pin: parseInt(process.env.pin) || 0,
    stripType: process.env.stripType || 'WS2812',
    barPixels: parseInt(process.env.barPixels) || 0,
    boards: parseInt(process.env.boards) || 0,
    port: parseInt(process.env.port) || 421
};

// Constants
const BOARD_WIDTH = 32;
const BOARD_HEIGHT = 8;
const REQUIRED_PERMISSION = 'auxiliary';

// Initialize strip
const maxPixels = config.barPixels + config.boards * BOARD_WIDTH * BOARD_HEIGHT;
let strip = ws281x(maxPixels, {
	dma: 10,
	freq: 800000,
	gpio: config.pin,
	invert: false,
	brightness: config.brightness,
	stripType: ws281x.stripType[config.stripType]
});

// Clear pixels
let pixels = strip.array;
for (let i = 0; i < pixels.length; i++) {
	pixels[i] = 0x000000;
}
ws281x.render();

// State
let state = {
	config,
	pixels,
	ws281x,
	connected: false,
	socket: null,
	classId: null,
	pollData: {},
	boardIntervals: [],
	timerData: {
		startTime: 0,
		timeLeft: 0,
		active: false,
		sound: false
	},
	sounds: loadSounds(),
	BOARD_WIDTH,
	BOARD_HEIGHT,
	REQUIRED_PERMISSION
};

// Initialize folders
if (!fs.existsSync('bgm')) {
	fs.mkdirSync('bgm');
}
if (!fs.existsSync('sfx')) {
	fs.mkdirSync('sfx');
}

module.exports = state;
