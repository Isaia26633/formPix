/**
 * Middleware for checking connection status
 */

const logger = require('../utils/logger');

/**
 * Check if connected to formBar
 */
function checkConnection(req, res, next) {
	const { connected } = require('../state');
	
	if (!connected) {
		logger.warn('API request blocked: Not connected to formBar', { url: req.url });
		res.json({ source: 'Formpix', error: 'This formPix is not connected to a formBar' })
		return
	}

	next()
}

module.exports = checkConnection;
