var FORM_PIX_URL = 'http://localhost:3000';
var API_KEY = null;

function login(url, key) {
	FORM_PIX_URL = url;
	API_KEY = key;
}

let reqOptions =
{
	method: 'POST',
	headers: {
		'API': API_KEY,
		'Content-Type': 'application/json'
	}
};

function sendCommand(command, params, reqOptions) {
	fetch(`${FORM_PIX_URL}/api/${endpoint}?${params}`, reqOptions)
		.then((response) => {
			// Convert received data to JSON
			return response.json();
		})
		.then((data) => {
			// Log the data if the request is successful
			console.log(data);
		})
		.catch((err) => {
			// If there's a problem, handle it...
			if (err) console.log('connection closed due to errors:', err);
		});
}

function fill(color, start, length) {

	let params = new URLSearchParams({
		color: color,
		start: start,
		length: length
	}).toString()

	sendCommand('fill', params, reqOptions);
}

function gradient(startColor, endColor, start, length) {

	let params = new URLSearchParams({
		startColor: startColor,
		endColor: endColor,
		start: start,
		length: length
	}).toString()

	sendCommand('gradient', params, reqOptions);
}

function setPixel(location, color) {
	let params = new URLSearchParams({
		location: location,
		color: color
	}).toString()

	sendCommand('setPixel', params, reqOptions);
}

function setPixels(pixels) {
	let params = new URLSearchParams({
		pixels: pixels
	}).toString()

	sendCommand('setPixels', params, reqOptions);
}

function say(text, color, bgcolor) {

	let params = new URLSearchParams({
		text: text,
		textColor: color,
		backgroundColor: bgcolor
	}).toString()

	sendCommand('say', params, reqOptions);
}

function getSounds(type) {
	let getOptions =
	{
		method: 'GET',
		headers: {
			'API': API_KEY,
			'Content-Type': 'application/json'
		}
	};

	let params = new URLSearchParams({
		type: type
	}).toString()

	sendCommand('say', params, getOptions);

}

function playSound(sfx, bgm) {
	let params = new URLSearchParams({
		sfx: sfx,
		bgm: bgm
	}).toString()

	sendCommand('playSound', params, reqOptions);
}

module.exports = {
	login, fill, gradient, setPixel, setPixels, say, getSounds, playSound
};

// Example usage
// fill('#ff0000', 0, 10);
// say('Hello World', 'white', 'black');