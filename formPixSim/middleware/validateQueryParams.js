/**
 * Middleware for validating query parameters
 */

const logger = require('../utils/logger');

/**
 * Check for multiple of the same query parameter
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next callback.
 * @returns {void}
 */
function validateQueryParams(req, res, next) {
	let query = req.query

	for (let key in query) {
		if (Array.isArray(query[key])) {
			logger.warn('Query parameter validation failed', { parameter: key, url: req.url });
			res.status(400).json({ error: `You can only have one ${key} parameter` })
			return
		}
	}

	next()
}

module.exports = validateQueryParams;
