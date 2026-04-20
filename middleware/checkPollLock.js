/**
 * Middleware for blocking non-formbar vPixels API calls during active polls.
 */

const logger = require('../utils/logger');

function isFormbarRequest(apiKey, formbarApiKey) {
	return Boolean(apiKey) && Boolean(formbarApiKey) && apiKey === formbarApiKey;
}

function checkPollLock(req, res, next) {
	const { pollLock, config } = require('../state');
	const apiKey = req.headers.api;

	if (!pollLock.vpixelsLocked) {
		next();
		return;
	}

	if (isFormbarRequest(apiKey, config.api)) {
		next();
		return;
	}

	logger.info('vPixels request blocked by poll lock', {
		url: req.url,
		method: req.method
	});
	res.status(423).json({
		source: 'Formpix',
		error: 'vPixels are locked while a poll is active'
	});
}

module.exports = checkPollLock;
