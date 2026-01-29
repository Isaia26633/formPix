/**
 * FormPix - LED Display Controller
 * Main application file with organized routes and middleware
 */

const http = require('http');
const express = require('express');
const { io } = require('socket.io-client');

// Load application state
const state = require('./state');

// Import middleware
const checkConnection = require('./middleware/checkConnection');
const checkPermissions = require('./middleware/checkPermissions');
const validateQueryParams = require('./middleware/validateQueryParams');
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

// ============================================================================
// EXPRESS SETUP
// ============================================================================

const app = express();
const httpServer = http.createServer(app);

// Middleware
app.use(checkConnection);
app.use(checkPermissions);
app.use(validateQueryParams);

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
// SERVER START
// ============================================================================

httpServer.listen(state.config.port, async () => {
	console.log(`Server is up and running on port: ${state.config.port}`);
});