const formpix = require('./formpixapi.js')

formpix.login("http://localhost:3000/", "")

formpix.fill('#ff0000', 0, 10);
formpix.say('Hello World!', '#00ff00', '#0000ff');