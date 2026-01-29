/**
 * Middleware for checking permissions
 */

/**
 * Check user permissions
 */
async function checkPermissions(req, res, next) {
	try {
		const { config } = require('../state');
		const { REQUIRED_PERMISSION, classId } = require('../state');
		
		let apiKey = req.headers.api

		if (!req.url) {
			res.status(400).json({ source: 'Formpix', error: 'Missing URL' })
			return
		}

		let urlPath = req.url

		if (urlPath.indexOf('?') != -1) {
			urlPath = urlPath.slice(0, urlPath.indexOf('?'))
		}
		if (urlPath[urlPath.length - 1] == '/') {
			urlPath = urlPath.slice(0, urlPath.length - 1)
		}

		if (urlPath == '' || urlPath == 'socket.io/socket.io.js') {
			next()
			return
		}

		if (!apiKey) {
			res.status(400).json({ source: 'Formpix', error: 'Missing API key' })
			return
		}

		let response = await fetch(`${config.formbarUrl}/api/apiPermissionCheck?api=${apiKey}&permissionType=${REQUIRED_PERMISSION}&classId=${classId}`, {
			method: 'GET',
			headers: {
				api: config.api
			}
		});

		let data = await response.json();
		if (data.error) {
			res.status(response.status).json({ source: 'Formbar', status: data.error })
			return
		}

		if (response.status !== 200) {
			res.status(response.status).json({ source: 'Formbar', message: response.statusText, data })
			return
		}

		next()
	} catch (err) {
		res.status(500).json({ source: 'Formpix', error: 'There was a server error try again' })
		return
	}
}

module.exports = checkPermissions;
