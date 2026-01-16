/**
 * FormPix - LED Display Controller
 * Main application file with organized routes and middleware
 */

const express = require('express');
const http = require('http');

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
const infoRoutes = require('./routes/infoRoutes');

// Import socket handlers
const { handleConnectError, handleConnect, handleSetClass, handleRequestClassUpdate } = require('./sockets/connectionHandlers');
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
const webIo = require('socket.io')(httpServer);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/static'));
app.use('/bgm', express.static(__dirname + '/bgm'));
app.use('/sfx', express.static(__dirname + '/sfx'));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Store webIo in state for event handlers
state.webIo = webIo;
state.ws281x.render = async () => {
	let sockets = await webIo.fetchSockets();
	for (let socket of sockets) {
		socket.emit('render', new Array(...state.pixels));
	}
};

// API Routes
app.use(checkConnection);
app.use(checkPermissions);
app.use(validateQueryParams);
app.use('/api', pixelRoutes);
app.use('/api', displayRoutes);
app.use('/api', soundRoutes);
app.use('/api', infoRoutes);

// Main page
app.get('/', (request, response) => {
	response.render('index', {
		config: state.config,
		BOARD_WIDTH: state.BOARD_WIDTH,
		BOARD_HEIGHT: state.BOARD_HEIGHT,
		pixels: state.pixels
	});
});

// Error handling
app.use(handle404);

// ============================================================================
// SOCKET.IO SETUP (WebSocket for browser clients)
// ============================================================================

webIo.on('connection', (socket) => {
	console.log('Browser client connected');
});

// ============================================================================
// FORMBAR SOCKET.IO SETUP
// ============================================================================

const socket = state.socket;

// Connection events
socket.on('connect_error', handleConnectError(socket, state.boardIntervals));
socket.on('connect', handleConnect(socket, state.boardIntervals));
socket.on('setClass', handleSetClass(socket, state.boardIntervals));
socket.on('requestClassUpdate', handleRequestClassUpdate(socket));
// Sound events
socket.on('helpSound', handleHelpSound(webIo));
socket.on('breakSound', handleBreakSound(webIo));
socket.on('pollSound', handlePollSound(webIo));
socket.on('removePollSound', handleRemovePollSound(webIo));
socket.on('joinSound', handleJoinSound(webIo));
socket.on('leaveSound', handleLeaveSound(webIo));
socket.on('kickStudentsSound', handleKickStudentsSound(webIo));
socket.on('endClassSound', handleEndClassSound(webIo));
socket.on('timerSound', handleTimerSound(webIo));

// Poll and timer events
socket.on('classUpdate', handleClassUpdate(webIo));
socket.on('vbTimer', handleVBTimer());

// ============================================================================
// SERVER START
// ============================================================================

httpServer.listen(state.config.port, async () => {
	console.log(`Server running on port: ${state.config.port}`);
});