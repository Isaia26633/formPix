/**
 * Global application state for formPixSim
 */

const fs = require('fs');
const { io } = require('socket.io-client');
const { loadSounds } = require('./utils/soundUtils');
const env = require('dotenv').config();

// Load config
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
const PIXELS_PER_LETTER = 5;

// Initialize pixels
const maxPixels = config.barPixels + config.boards * BOARD_WIDTH * BOARD_HEIGHT;
let pixels = new Uint32Array(maxPixels).fill(0x000000);

// Mock ws281x object for simulation
const ws281x = {
	render: async () => {
		// This will be called with webIo to send to clients
	}
};

// Create socket connection
const socket = io(config.formbarUrl, {
	extraHeaders: {
		api: config.api
	}
});

// State
let state = {
	config,
	pixels,
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
	ws281x,
	BOARD_WIDTH,
	BOARD_HEIGHT,
	REQUIRED_PERMISSION,
	PIXELS_PER_LETTER
};

// Initialize folders
if (!fs.existsSync('bgm')) {
	fs.mkdirSync('bgm');
}
if (!fs.existsSync('sfx')) {
	fs.mkdirSync('sfx');
}

module.exports = state;
