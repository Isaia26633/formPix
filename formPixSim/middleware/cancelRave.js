/**
 * Middleware to cancel any ongoing rave animation before pixel operations
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next callback.
 * @returns {void}
 */
function cancelRaveMiddleware(req, res, next) {
	const raveController = require('../controllers/raveControllers');
	
	if (raveController.currentRaveInterval) {
		clearInterval(raveController.currentRaveInterval);
		raveController.currentRaveInterval = null;
	}
	
	next();
}

module.exports = cancelRaveMiddleware;
