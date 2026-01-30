/**
 * Middleware for validating query parameters
 */

const logger = require('../utils/logger');

/**
 * Check for multiple of the same query parameter
 */
function validateQueryParams(req, res, next) {
	let query = req.query

	for (let key in query) {
		if (Array.isArray(query[key])) {
			res.status(400).json({ source: 'Formpix', error: `You can only have one ${key} parameter` })
			logger.warn('Query parameter validation failed', { parameter: key, url: req.url });
			return
		}
	}

	next()
}

module.exports = validateQueryParams;