/**
 * Middleware for blocking non-formbar vPixels API calls during active polls.
 */

const logger = require('../utils/logger');

function isFormbarRequest(apiKey, formbarApiKey) {
	return Boolean(apiKey) && Boolean(formbarApiKey) && apiKey === formbarApiKey;
}

function extractHost(value) {
	if (!value) return null;
	try {
		return new URL(value).host;
	} catch (_) {
		return null;
	}
}

function checkPollLock(req, res, next) {
	const { pollLock, config } = require('../state');
	const apiKey = req.headers.api;
	const formbarHost = extractHost(config.formbarUrl);
	const originHost = extractHost(req.headers.origin);
	const refererHost = extractHost(req.headers.referer);
	const trustedOrigin = formbarHost && (originHost === formbarHost || refererHost === formbarHost);

	if (!pollLock.vpixelsLocked) {
		next();
		return;
	}

	if (isFormbarRequest(apiKey, config.api) || trustedOrigin) {
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
