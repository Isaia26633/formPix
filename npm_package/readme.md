# Formpix Module
For interacting with a formPix instance easily.

## Install in node.js project
```bash
npm i formpix
```

## Example script
```javascript
const formpix = require('formpixapi')

formpix.login(
    "ADDRESS OF FORMPIX INSTANCE HERE, NO '/'... ",
    "GET AN API KEY FROM THE FORMBAR INSTANCE THE FORMPIX IS CONNECTED TO"
    )

formpix.fill('#ff0000', 0, 10);
```

## Methods

```javascript
// Connect to formpix
formpix.login(formpixURL, formbarAPIkey);

// Fill length of bar with color
formpix.fill(color, start, length);

// Fill length of bar with two color gradient
formpix.gradient(startColor, endColor, start, length);

// Set a single pixel to a color
formpix.setPixel(location, color);

//Set and array of pixels (as pixel objects)
// { "pixelNumber": integer, "color": #hexcolor }
formpix.setPixels(pixels);

// Display text on the board extension
formpix.say(text, color, bgcolor);

// Get a list of 'bgm' or 'sfx' on the formpix
// type is 'bgm' or 'sfx'
formpix.getSounds(type);

// Play a bgm or sound on the formpix
// Use 'null' for the parameter you don't want to use
formpix.playSound(sfx, bgm);
```