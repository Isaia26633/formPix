const formpix = require('./formpixapi.js')

formpix.login("http://172.16.3.101:421", "YOUR_API_KEY_HERE")

// formpix.fill('#ff0000', 0, 10);
// formpix.fillByPercent(50, '#ff0000', '#000000');
// formpix.gradient('#ff0000', '#0000ff', 0, 10);
// formpix.setPixel(0, '#ff0000');
// formpix.setPixels([{ pixelNumber: 0, color: '#ff0000' }]);
// formpix.progress({ fg1: '#00ff00', duration: 5000 });
// formpix.rave({ mode: 'rainbow', speed: 50 });
// formpix.raveStop();
formpix.say('Hello World!', '#00ff00', '#0000ff');
// formpix.getDisplay();
// formpix.getSounds('formbar');
// formpix.playSound('19dfnc.wav', null);