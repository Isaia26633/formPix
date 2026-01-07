/**
 * Middleware for checking connection status
 */

/**
 * Check if connected to formBar
 */
function checkConnection(req, res, next) {
	const { connected } = require('../state');
	
	if (!connected) {
		res.json({ error: 'This formPix is not connected to a formBar' })
		return
	}

	next()
}

module.exports = checkConnection;
