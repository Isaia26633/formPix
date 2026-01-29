/**
 * Middleware for 404 errors
 */

const logger = require('../utils/logger');

/**
 * Handle 404 errors
 */
function handle404(req, res, next) {
	try {
		let urlPath = req.url
		if (urlPath.indexOf('/') != -1) {
			urlPath = urlPath.slice(urlPath.indexOf('/') + 1)
		}
		if (urlPath.indexOf('?') != -1) {
			urlPath = urlPath.slice(0, urlPath.indexOf('?'))
		}

		logger.warn('404 Not Found', { url: urlPath, method: req.method });
		res.status(404).json({ error: `The endpoint ${urlPath} does not exist` })
	} catch (err) {
		logger.error('Error in 404 handler', { error: err.message, stack: err.stack });
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

module.exports = handle404;