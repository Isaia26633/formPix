/**
 * Middleware that locks board/bar activity during active polls.
 */

const logger = require('../utils/logger');

const SOUND_ROUTES = new Set([
	'/api/getSounds',
	'/api/playSound'
]);

const PIXEL_ROUTES = new Set([
	'/api/fill',
	'/api/fillByPercent',
	'/api/gradient',
	'/api/setPixel',
	'/api/setPixels',
	'/api/progress',
	'/api/rave',
	'/api/rave/stop'
]);

function normalizeRequestPath(originalUrl = '') {
	let normalizedPath = originalUrl.split('?')[0];
	if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
		normalizedPath = normalizedPath.slice(0, -1);
	}
	return normalizedPath;
}

function enforcePollLock(req, res, next) {
	const { pollLock, config } = require('../state');
	if (!pollLock.active) {
		next();
		return;
	}

	const apiKey = req.headers.api;
	const path = normalizeRequestPath(req.originalUrl || req.url || '');
	const isSoundRoute = SOUND_ROUTES.has(path);
	const isPixelRoute = PIXEL_ROUTES.has(path);
	const isFormbarRequest = apiKey === config.api;

	if (isSoundRoute) {
		next();
		return;
	}

	if (isPixelRoute && isFormbarRequest) {
		next();
		return;
	}

	logger.warn('Poll lock blocked request', {
		path,
		method: req.method,
		isSoundRoute,
		isPixelRoute,
		isFormbarRequest
	});

	res.status(423).json({
		source: 'FormpixSim',
		error: 'Poll lock is active. Only sound routes and formbar pixel routes are allowed.'
	});
}

module.exports = enforcePollLock;
