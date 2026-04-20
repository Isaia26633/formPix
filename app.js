/**
 * FormPix - LED Display Controller
 * Main application file with organized routes and middleware
 */

const http = require('http');
const express = require('express');
const { io } = require('socket.io-client');

// Import IR Remote module
const { IRRemote } = require('./utils/irRemote');

// Load application state
const state = require('./state');

// Import middleware
const checkConnection = require('./middleware/checkConnection');
const checkPermissions = require('./middleware/checkPermissions');
const validateQueryParams = require('./middleware/validateQueryParams');
const pollLock = require('./middleware/pollLock');
const handle404 = require('./middleware/handle404');

// Import routes
const pixelRoutes = require('./routes/pixelRoutes');
const displayRoutes = require('./routes/displayRoutes');
const soundRoutes = require('./routes/soundRoutes');

// Import socket handlers
const { handleConnectError, handleConnect, handleSetClass } = require('./sockets/connectionHandlers');
const {
	handleHelpSound,
	handleBreakSound,
	handlePollSound,
	handleRemovePollSound,
	handleJoinSound,
	handleLeaveSound,
	handleKickStudentsSound,
	handleEndClassSound,
	handleTimerSound
} = require('./sockets/soundHandlers');
const { handleClassUpdate } = require('./sockets/pollHandlers');
const { handleVBTimer } = require('./sockets/timerHandlers');
const { playSound, getRandomBootupSound } = require('./utils/soundUtils');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// ============================================================================
// EXPRESS SETUP
// ============================================================================

const app = express();
const httpServer = http.createServer(app);

// Middleware
app.use(checkConnection);
app.use(checkPermissions);
app.use(validateQueryParams);
app.use('/api', pollLock);

// Routes

// Routes
app.use('/api', pixelRoutes);
app.use('/api', displayRoutes);
app.use('/api', soundRoutes);

// Error handling
app.use(handle404);

// ============================================================================
// SOCKET.IO SETUP
// ============================================================================

const socket = io(state.config.formbarUrl, {
	extraHeaders: {
		api: state.config.api
	}
});

state.socket = socket;

// Connection events
socket.on('connect_error', handleConnectError(socket, state.boardIntervals));
socket.on('connect', handleConnect(socket, state.boardIntervals));
socket.on('setClass', handleSetClass(socket, state.boardIntervals));

// Sound events
socket.on('helpSound', handleHelpSound());
socket.on('breakSound', handleBreakSound());
socket.on('pollSound', handlePollSound());
socket.on('removePollSound', handleRemovePollSound());
socket.on('joinSound', handleJoinSound());
socket.on('leaveSound', handleLeaveSound());
socket.on('kickStudentsSound', handleKickStudentsSound());
socket.on('endClassSound', handleEndClassSound());
socket.on('timerSound', handleTimerSound());

// Poll and timer events
socket.on('classUpdate', handleClassUpdate());
socket.on('vbTimer', handleVBTimer());

// ============================================================================
// SQL SETUP
// ============================================================================
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
	fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = state.config.sqlitePath
	? path.resolve(state.config.sqlitePath)
	: path.join(dbDir, 'formpix.db');

state.db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error('SQLite connection failed:', err.message);
		return;
	}
	console.log(`SQLite connected: ${dbPath}`);
});

state.db.serialize(() => {
	state.db.run(`
		CREATE TABLE IF NOT EXISTS submissions (
			entry INTEGER PRIMARY KEY AUTOINCREMENT,
			id NOT NULL,
			email TEXT NOT NULL,
			text TEXT NOT NULL
		)
	`);
});

const closeDb = () => {
	if (state.db) {
		state.db.close((err) => {
			if (err) console.error('SQLite close failed:', err.message);
		});
	}
};

process.on('beforeExit', closeDb);

// ============================================================================
// SERVER START
// ============================================================================

httpServer.listen(state.config.port, () => {
	console.log(`Server is up and running on port: ${state.config.port}`);

	// Play bootup sound
	playSound({ formbar: getRandomBootupSound() });

	// Initialize IR Remote (uses GPIO pin from config)
	// Set irPin to -1 in .env to disable IR remote
	if (state.config.irPin !== -1) {
		const irRemote = new IRRemote(socket, state.config.irPin);
		irRemote.start();
		state.irRemote = irRemote;
	}

	// Gracefully stop IR Remote on process shutdown to cleanup GPIO
	const cleanupIrRemote = () => {
		if (state.irRemote && typeof state.irRemote.stop === 'function') {
			try {
				state.irRemote.stop();
			} catch (err) {
				console.error('Error while stopping IR Remote:', err);
			}
		}
	};

	process.on('SIGINT', () => {
		cleanupIrRemote();
		process.exit(0);
	});

	process.on('SIGTERM', () => {
		cleanupIrRemote();
		process.exit(0);
	});

	process.on('exit', () => {
		cleanupIrRemote();
	});
});