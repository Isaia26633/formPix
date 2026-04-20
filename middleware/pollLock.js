/**
 * Deprecated middleware placeholder.
 * Kept only to avoid breaking old imports during cleanup.
 */

function passthrough(req, res, next) {
	next();
}

module.exports = passthrough;