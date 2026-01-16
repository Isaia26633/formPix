/**
 * Global application state for formPixSim
 */

const fs = require('fs');
const { io } = require('socket.io-client');
const { loadSounds } = require('./utils/soundUtils');
require('dotenv').config();
const ws281xNative = require('rpi-ws281x-native');

// Load config from .env
const config = {
    formbarUrl: process.env.formbarUrl || '',
    api: process.env.api || '',
    brightness: parseInt(process.env.brightness) || 80,
    pin: parseInt(process.env.pin) || 18,      // fallback to 18
    stripType: process.env.stripType || 'WS2812',
    barPixels: parseInt(process.env.barPixels) || 0,
    boards: parseInt(process.env.boards) || 3,
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

// Initialize ws281x LED strip
try {
    ws281xNative.init({
        leds: maxPixels,
        gpio: config.pin,
        brightness: config.brightness
    });
    console.log(`LED strip initialized on GPIO ${config.pin} with ${maxPixels} pixels`);
} catch (err) {
    console.error('Error initializing LED strip:', err.message);
}

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
    ws281x: ws281xNative,
    BOARD_WIDTH,
    BOARD_HEIGHT,
    REQUIRED_PERMISSION,
    PIXELS_PER_LETTER
};

// Initialize folders
if (!fs.existsSync('bgm')) fs.mkdirSync('bgm');
if (!fs.existsSync('sfx')) fs.mkdirSync('sfx');

module.exports = state;