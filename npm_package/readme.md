# Formpix Module
For interacting with a formPix instance easily.

## Install in node.js project
```bash
npm i formpix
```

## Example script
```javascript
const formpix = require('formpix')

formpix.login(
    "ADDRESS OF FORMPIX INSTANCE HERE, NO '/'... ",
    "GET AN API KEY FROM THE FORMBAR INSTANCE THE FORMPIX IS CONNECTED TO"
    )

formpix.fill('#ff0000', 0, 10);
```

## Methods

All methods return a Promise with the server response.

```javascript
// Connect to formpix
formpix.login(formpixURL, formbarAPIkey);

// Fill length of bar with color
formpix.fill(color, start, length);

// Fill a percentage of the bar with a fill color and background color
// length is optional
formpix.fillByPercent(percent, fillColor, bgColor, length);

// Fill length of bar with two color gradient
formpix.gradient(startColor, endColor, start, length);

// Set a single pixel to a color
formpix.setPixel(pixel, color);

// Set an array of pixels (as pixel objects)
// { "pixelNumber": integer, "color": "#hexcolor" }
formpix.setPixels(pixels);

// Animate a progress bar
// options: { bg1, bg2, fg1, fg2, start, length, startingFill, duration, easing, interval }
// All options are optional. duration is in milliseconds.
formpix.progress({ fg1: '#00ff00', duration: 5000 });

// Start rave mode
// options: { speed, mode, intensity, bpm }
// mode: 'rainbow' | 'strobe' | 'pulse' | 'chase' | 'crazy'
formpix.rave({ mode: 'rainbow', speed: 50 });

// Stop rave mode
formpix.raveStop();

// Display text on the board extension
// scroll is optional (scroll speed in ms)
formpix.say(text, color, bgcolor, scroll);

// Get the current display info
formpix.getDisplay();

// Get a list of sounds on the formpix
// type: 'formbar' or 'meme' (omit for all)
formpix.getSounds(type);

// Play a sound on the formpix
// Use null/undefined for the parameter you don't want to use
formpix.playSound(formbar, meme);
```