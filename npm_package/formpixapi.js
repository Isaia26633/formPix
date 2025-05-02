var FORM_PIX_URL = 'http://localhost:3000';
var API_KEY = null;

function login(url, key) {
	FORM_PIX_URL = url;
	API_KEY = key;
}

function fill(color, start, length) {

	let reqOptions =
	{
		method: 'POST',
		headers: {
			'API': API_KEY,
			'Content-Type': 'application/json'
		}
	};

	let params = new URLSearchParams({
		color: color,
		start: start,
		length: length
	}).toString()

	fetch(`${FORM_PIX_URL}/api/fill?${params}`, reqOptions)
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

function say(text, color, bgcolor) {
	let reqOptions =
	{
		method: 'POST',
		headers: {
			'API': API_KEY,
			'Content-Type': 'application/json'
		}
	};

	let params = new URLSearchParams({
		text: text,
		textColor: color,
		backgroundColor: bgcolor
	}).toString()

	fetch(`${FORM_PIX_URL}/api/say?${params}`, reqOptions)
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

module.exports = {
	login, fill, say
};

// Example usage
// fill('#ff0000', 0, 10);
// say('Hello World', 'white', 'black');