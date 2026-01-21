/**
 * Global application state
 */

const fs = require('fs');
const ws281x = require('rpi-ws281x-native');
const { loadSounds } = require('./utils/soundUtils');
const env = require('dotenv');
const { io } = require('socket.io-client');
env.config();

console.log('Raw env values:');
console.log('  pin:', process.env.pin);
console.log('  brightness:', process.env.brightness);
console.log('  barPixels:', process.env.barPixels);

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

console.log('Parsed config:');
console.log('  pin:', config.pin);
console.log('  brightness:', config.brightness);
console.log('  barPixels:', config.barPixels);

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

// Initialize socket.io client connection to formbar
const socket = io(config.formbarUrl, {
	extraHeaders: {
		api: config.api
	}
});

// State
let state = {
	config,
	pixels,
	ws281x,
	connected: false,
	socket,
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

// Initialize folders if not found
if (!fs.existsSync('bgm')) {
	fs.mkdirSync('bgm');
}
if (!fs.existsSync('sfx')) {
	fs.mkdirSync('sfx');
}

module.exports = state;
