/**
 * Middleware for blocking non-formbar vPixels API calls during active polls.
 */

const logger = require('../utils/logger');

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
	const formbarHost = extractHost(config.formbarUrl);
	const originHost = extractHost(req.headers.origin);
	const refererHost = extractHost(req.headers.referer);
	const trustedOrigin = formbarHost && (originHost === formbarHost || refererHost === formbarHost);

	if (!pollLock.vpixelsLocked) {
		next();
		return;
	}

	if (trustedOrigin) {
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
