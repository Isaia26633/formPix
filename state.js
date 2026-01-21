/**
 * Global application state
 */

const fs = require('fs');
const path = require('path');
const ws281x = require('rpi-ws281x-native');
const { loadSounds } = require('./utils/soundUtils');
const dotenv = require('dotenv');
const { io } = require('socket.io-client');

// 🔴 FORCE dotenv to load from THIS directory (sudo-safe)
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug (keep for now)
console.log('ENV pin =', process.env.pin);

// Load config from the .env
const config = {
    formbarUrl: process.env.formbarUrl || '',
    api: process.env.api || '',
    brightness: parseInt(process.env.brightness, 10) || 50,
    pin: parseInt(process.env.pin, 10) || 18,
    stripType: process.env.stripType || 'WS2812',
    barPixels: parseInt(process.env.barPixels, 10) || 0,
    boards: parseInt(process.env.boards, 10) || 0,
    port: parseInt(process.env.port, 10) || 421
};

console.log('CONFIG pin =', config.pin);

// Constants
const BOARD_WIDTH = 32;
const BOARD_HEIGHT = 8;
const REQUIRED_PERMISSION = 'auxiliary';

// Total LED count
const maxPixels =
    config.barPixels +
    config.boards * BOARD_WIDTH * BOARD_HEIGHT;

// 🚨 SAFETY CHECK
if (!config.pin || isNaN(config.pin)) {
    throw new Error('Invalid GPIO pin. Check your .env file.');
}

// Initialize LED strip
const strip = ws281x(maxPixels, {
    dma: 10,
    freq: 800000,
    gpio: config.pin, // MUST be GPIO 18
    invert: false,
    brightness: config.brightness,
    stripType: ws281x.stripType[config.stripType]
});

// Clear LEDs
const pixels = strip.array;
for (let i = 0; i < pixels.length; i++) {
    pixels[i] = 0x000000;
}
ws281x.render();

// Initialize socket.io connection
const socket = io(config.formbarUrl, {
    extraHeaders: {
        api: config.api
    }
});

// Global state object
const state = {
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

// Ensure folders exist
if (!fs.existsSync('bgm')) fs.mkdirSync('bgm');
if (!fs.existsSync('sfx')) fs.mkdirSync('sfx');

// Graceful shutdown
process.on('SIGINT', () => {
    ws281x.reset();
    process.exit();
});

module.exports = state;