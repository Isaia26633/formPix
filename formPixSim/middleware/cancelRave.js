/**
 * Middleware to cancel any ongoing rave animation before pixel operations
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
