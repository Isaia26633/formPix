/**
 * Controllers for LED pixel routes
 */

const logger = require('../utils/logger');
const { textToHexColor } = require('../utils/colorUtils');
const { fill, gradient } = require('../utils/pixelOps');
const { getPixelNumber } = require('../utils/pixelUtils');

/**
 * POST /api/percentage - Fill a percentage of the LED strip with a color
 */
function percentageController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');

		let { percent, color } = req.query
		color = textToHexColor(color)
		percent = Number(percent)
		if (typeof color == 'string') {
			res.status(400).json({ error: color })
			return
		}
		if (color instanceof Error) throw color
		if (isNaN(percent) || percent < 0 || percent > 100) {
			res.status(400).json({ error: 'percent must be a number between 0 and 100' })
			return
		}
		let length = Math.floor((percent / 100) * pixels.length)
		fill(pixels, color, 0, length)
		ws281x.render()
		logger.info('Percentage fill completed', { percent, color: color.toString(16), length });
		res.status(200).json({ message: 'ok' })
	} catch (err) {
		logger.error('Error in percentageController', { error: err.message, stack: err.stack, query: req.query });
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

/**	
 * POST /api/progress - Fill a progress bar on the LED strip
 */

let currentProgressInterval = null;
let currentRaveInterval = null;

/**
 * POST /api/rave - Create rave visuals on the bar with flashing rainbow colors
 */
async function raveController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');
		let {
			speed = 50,
			mode = 'rainbow',
			intensity = 100
		} = req.query;

		speed = Number(speed);
		intensity = Number(intensity);

		// Validate parameters
		if (isNaN(speed) || speed <= 0) {
			res.status(400).json({ error: 'speed must be a positive number' });
			return;
		}

		if (isNaN(intensity) || intensity < 0 || intensity > 100) {
			res.status(400).json({ error: 'intensity must be a number between 0 and 100' });
			return;
		}

		// Cancel any existing rave animation
		if (currentRaveInterval) {
			clearInterval(currentRaveInterval);
			currentRaveInterval = null;
		}

		// Cancel any existing progress animation
		if (currentProgressInterval) {
			clearInterval(currentProgressInterval);
			currentProgressInterval = null;
		}

		const barLength = config.barPixels;
		let offset = 0;
		const intensityMultiplier = intensity / 100;
		
		// Chase mode needs persistent chaser positions and directions
		const chasers = [
			{ pos: 0, speed: 2.5, size: 10, hueOffset: 0, dir: 1 },       // Fast red
			{ pos: 15, speed: 1.8, size: 12, hueOffset: 120, dir: 1 },    // Green
			{ pos: 30, speed: 3.2, size: 8, hueOffset: 240, dir: 1 },     // Super fast blue
			{ pos: 45, speed: 1.2, size: 15, hueOffset: 60, dir: -1 },    // Yellow going backwards
			{ pos: 60, speed: 2.8, size: 9, hueOffset: 180, dir: -1 },    // Cyan backwards
			{ pos: 75, speed: 2.0, size: 11, hueOffset: 300, dir: 1 },    // Magenta
			{ pos: 90, speed: 3.5, size: 7, hueOffset: 30, dir: -1 },     // Orange backwards
			{ pos: 105, speed: 1.5, size: 14, hueOffset: 200, dir: 1 }    // Teal
		];
		
		// Crazy mode tracking
		let currentCrazyMode = 'rainbow';
		let modeChangeCounter = 0;
		const modeRotationSpeed = 30; // Change mode every 30 frames (FASTER!)
		let glitchCounter = 0;

		currentRaveInterval = setInterval(() => {
			if (mode === 'rainbow') {
				// Rainbow wave effect
				for (let i = 0; i < barLength; i++) {
					const hue = (((i + offset) % barLength) / barLength) * 360;
					const rgb = hsvToRgb(hue, 1, intensityMultiplier);
					pixels[i] = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
				}
			} else if (mode === 'strobe') {
				// Strobe effect with random colors
				const hue = Math.random() * 360;
				const rgb = hsvToRgb(hue, 1, intensityMultiplier);
				const color = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
				fill(pixels, color, 0, barLength);
			} else if (mode === 'pulse') {
				// Pulsing rainbow effect
				const pulse = (Math.sin(offset / 10) + 1) / 2;
				for (let i = 0; i < barLength; i++) {
					const hue = ((i / barLength) * 360 + offset * 5) % 360;
					const rgb = hsvToRgb(hue, 1, pulse * intensityMultiplier);
					pixels[i] = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
				}
			} else if (mode === 'chase') {
				// ABSOLUTE CHAOS - bouncing chasers with STROBING BACKGROUND
				
				// FULL STROBE BACKGROUND - changes every frame
				const bgHue = Math.random() * 360;
				const bgRgb = hsvToRgb(bgHue, 0.8, intensityMultiplier * 0.4);
				const bgColor = (bgRgb.r << 16) | (bgRgb.g << 8) | bgRgb.b;
				fill(pixels, bgColor, 0, barLength);
				
				// Additional random strobe sections (40% chance each frame)
				if (Math.random() < 0.4) {
					const strobePos = Math.floor(Math.random() * barLength);
					const strobeHue = Math.random() * 360;
					const strobeRgb = hsvToRgb(strobeHue, 1, intensityMultiplier);
					const strobeColor = (strobeRgb.r << 16) | (strobeRgb.g << 8) | strobeRgb.b;
					for (let i = 0; i < 8; i++) {
						const pos = (strobePos + i) % barLength;
						pixels[pos] = strobeColor;
					}
				}
				
				// Random sparkles (40% chance)
				if (Math.random() < 0.4) {
					const sparklePos = Math.floor(Math.random() * barLength);
					const sparkleRgb = hsvToRgb(Math.random() * 360, 1, intensityMultiplier);
					pixels[sparklePos] = (sparkleRgb.r << 16) | (sparkleRgb.g << 8) | sparkleRgb.b;
				}
				
				// Update and draw all bouncing chasers
				for (let chaser of chasers) {
					// Update position
					chaser.pos += chaser.speed * chaser.dir;
					
					// Bounce at edges with explosion effect
					if (chaser.pos <= 0 || chaser.pos >= barLength - chaser.size) {
						chaser.dir *= -1;
						// Explosion at bounce
						for (let i = 0; i < 20; i++) {
							const explosionPos = Math.floor(chaser.pos + (Math.random() - 0.5) * 15);
							if (explosionPos >= 0 && explosionPos < barLength) {
								const explosionHue = (chaser.hueOffset + Math.random() * 60) % 360;
								const explosionRgb = hsvToRgb(explosionHue, 1, intensityMultiplier);
								pixels[explosionPos] = (explosionRgb.r << 16) | (explosionRgb.g << 8) | explosionRgb.b;
							}
						}
					}
					
					// Clamp position
					chaser.pos = Math.max(0, Math.min(barLength - chaser.size, chaser.pos));
					
					const baseHue = ((offset * 15 + chaser.hueOffset) % 360);
					
					// Draw chaser with intense fading trail
					for (let i = 0; i < chaser.size; i++) {
						const pixelPos = Math.floor(chaser.pos + i);
						if (pixelPos >= 0 && pixelPos < barLength) {
							const trailFade = 1 - (i / chaser.size);
							const hue = (baseHue + i * 8) % 360;
							const rgb = hsvToRgb(hue, 1, trailFade * intensityMultiplier);
							
							// Additive blending for insane color mixing
							const existingR = (pixels[pixelPos] >> 16) & 0xff;
							const existingG = (pixels[pixelPos] >> 8) & 0xff;
							const existingB = pixels[pixelPos] & 0xff;
							
							const newR = Math.min(255, existingR + rgb.r);
							const newG = Math.min(255, existingG + rgb.g);
							const newB = Math.min(255, existingB + rgb.b);
							
							pixels[pixelPos] = (newR << 16) | (newG << 8) | newB;
						}
					}
				}
			} else if (mode === 'crazy') {
				// CRAZY MODE - ALL EFFECTS AT ONCE WITH ROTATING MODES
				
				// Rotate through modes every N frames
				modeChangeCounter++;
				if (modeChangeCounter >= modeRotationSpeed) {
					modeChangeCounter = 0;
					const modes = ['rainbow', 'strobe', 'pulse', 'chase'];
					currentCrazyMode = modes[Math.floor(Math.random() * modes.length)];
				}
				
				const midPoint = Math.floor(barLength / 2);
				
				// Split bar into two halves with different effects
				if (currentCrazyMode === 'rainbow') {
					// Left half: forward rainbow
					for (let i = 0; i < midPoint; i++) {
						const hue = (((i + offset) % midPoint) / midPoint) * 360;
						const rgb = hsvToRgb(hue, 1, intensityMultiplier);
						pixels[i] = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
					}
					// Right half: reverse rainbow
					for (let i = midPoint; i < barLength; i++) {
						const hue = (((midPoint - (i - midPoint) + offset) % midPoint) / midPoint) * 360;
						const rgb = hsvToRgb(hue, 1, intensityMultiplier);
						pixels[i] = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
					}
				} else if (currentCrazyMode === 'strobe') {
					// Split strobe - different colors on each half
					const hue1 = Math.random() * 360;
					const hue2 = (hue1 + 180) % 360; // Complementary color
					const rgb1 = hsvToRgb(hue1, 1, intensityMultiplier);
					const rgb2 = hsvToRgb(hue2, 1, intensityMultiplier);
					const color1 = (rgb1.r << 16) | (rgb1.g << 8) | rgb1.b;
					const color2 = (rgb2.r << 16) | (rgb2.g << 8) | rgb2.b;
					fill(pixels, color1, 0, midPoint);
					fill(pixels, color2, midPoint, barLength - midPoint);
				} else if (currentCrazyMode === 'pulse') {
					// Opposing pulse waves
					const pulse1 = (Math.sin(offset / 10) + 1) / 2;
					const pulse2 = (Math.cos(offset / 10) + 1) / 2;
					for (let i = 0; i < midPoint; i++) {
						const hue = ((i / midPoint) * 360 + offset * 5) % 360;
						const rgb = hsvToRgb(hue, 1, pulse1 * intensityMultiplier);
						pixels[i] = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
					}
					for (let i = midPoint; i < barLength; i++) {
						const hue = (((i - midPoint) / (barLength - midPoint)) * 360 - offset * 5) % 360;
						const rgb = hsvToRgb(hue, 1, pulse2 * intensityMultiplier);
						pixels[i] = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
					}
				} else if (currentCrazyMode === 'chase') {
					// Crazy chase with split zones
					const bgHue = Math.random() * 360;
					const bgRgb = hsvToRgb(bgHue, 0.8, intensityMultiplier * 0.3);
					const bgColor = (bgRgb.r << 16) | (bgRgb.g << 8) | bgRgb.b;
					fill(pixels, bgColor, 0, barLength);
					
					for (let chaser of chasers) {
						chaser.pos += chaser.speed * chaser.dir;
						
						if (chaser.pos <= 0 || chaser.pos >= barLength - chaser.size) {
							chaser.dir *= -1;
							// Mini explosion
							for (let i = 0; i < 10; i++) {
								const explosionPos = Math.floor(chaser.pos + (Math.random() - 0.5) * 10);
								if (explosionPos >= 0 && explosionPos < barLength) {
									const explosionHue = Math.random() * 360;
									const explosionRgb = hsvToRgb(explosionHue, 1, intensityMultiplier);
									pixels[explosionPos] = (explosionRgb.r << 16) | (explosionRgb.g << 8) | explosionRgb.b;
								}
							}
						}
						
						chaser.pos = Math.max(0, Math.min(barLength - chaser.size, chaser.pos));
						const baseHue = ((offset * 20 + chaser.hueOffset) % 360);
						
						for (let i = 0; i < chaser.size; i++) {
							const pixelPos = Math.floor(chaser.pos + i);
							if (pixelPos >= 0 && pixelPos < barLength) {
								const trailFade = 1 - (i / chaser.size);
								const hue = (baseHue + i * 10) % 360;
								const rgb = hsvToRgb(hue, 1, trailFade * intensityMultiplier);
								
								const existingR = (pixels[pixelPos] >> 16) & 0xff;
								const existingG = (pixels[pixelPos] >> 8) & 0xff;
								const existingB = pixels[pixelPos] & 0xff;
								
								const newR = Math.min(255, existingR + rgb.r);
								const newG = Math.min(255, existingG + rgb.g);
								const newB = Math.min(255, existingB + rgb.b);
								
								pixels[pixelPos] = (newR << 16) | (newG << 8) | newB;
							}
						}
					}
				}
				
				// MAXIMUM CHAOS - Add TONS of random elements every frame
				
				// Random full-screen glitch (10% chance)
				glitchCounter++;
				if (Math.random() < 0.1 || glitchCounter % 7 === 0) {
					const glitchLength = Math.floor(Math.random() * 20) + 5;
					const glitchPos = Math.floor(Math.random() * (barLength - glitchLength));
					const glitchHue = Math.random() * 360;
					const glitchRgb = hsvToRgb(glitchHue, 1, intensityMultiplier);
					fill(pixels, (glitchRgb.r << 16) | (glitchRgb.g << 8) | glitchRgb.b, glitchPos, glitchLength);
				}
				
				// Random strobe sections (50% chance) - INCREASED
				if (Math.random() < 0.5) {
					const strobePos = Math.floor(Math.random() * barLength);
					const strobeLength = Math.floor(Math.random() * 15) + 5;
					const strobeHue = Math.random() * 360;
					const strobeRgb = hsvToRgb(strobeHue, 1, intensityMultiplier);
					const strobeColor = (strobeRgb.r << 16) | (strobeRgb.g << 8) | strobeRgb.b;
					for (let i = 0; i < strobeLength; i++) {
						const pos = (strobePos + i) % barLength;
						pixels[pos] = strobeColor;
					}
				}
				
				// Random sparkles EVERYWHERE (60% chance) - INCREASED
				const sparkleCount = Math.floor(Math.random() * 5) + 3;
				for (let s = 0; s < sparkleCount; s++) {
					if (Math.random() < 0.6) {
						const sparklePos = Math.floor(Math.random() * barLength);
						const sparkleRgb = hsvToRgb(Math.random() * 360, 1, intensityMultiplier);
						pixels[sparklePos] = (sparkleRgb.r << 16) | (sparkleRgb.g << 8) | sparkleRgb.b;
					}
				}
				
				// Random inversion sections (20% chance)
				if (Math.random() < 0.2) {
					const invertStart = Math.floor(Math.random() * barLength / 2);
					const invertLength = Math.floor(Math.random() * 20) + 10;
					for (let i = invertStart; i < Math.min(invertStart + invertLength, barLength); i++) {
						const r = 255 - ((pixels[i] >> 16) & 0xff);
						const g = 255 - ((pixels[i] >> 8) & 0xff);
						const b = 255 - (pixels[i] & 0xff);
						pixels[i] = (r << 16) | (g << 8) | b;
					}
				}
				
				// Random rotating segments (30% chance)
				if (Math.random() < 0.3) {
					const segmentSize = 8;
					const segments = Math.floor(barLength / segmentSize);
					for (let seg = 0; seg < segments; seg++) {
						if (Math.random() < 0.5) {
							const segStart = seg * segmentSize;
							const hue = ((seg * 40 + offset * 10) % 360);
							const rgb = hsvToRgb(hue, 1, intensityMultiplier);
							for (let i = 0; i < segmentSize && segStart + i < barLength; i++) {
								const brightness = Math.sin(offset / 5 + i) * 0.5 + 0.5;
								const r = Math.floor(rgb.r * brightness);
								const g = Math.floor(rgb.g * brightness);
								const b = Math.floor(rgb.b * brightness);
								pixels[segStart + i] = (r << 16) | (g << 8) | b;
							}
						}
					}
				}
				
				// Lightning flash effect (15% chance)
				if (Math.random() < 0.15) {
					const flashColor = Math.random() > 0.5 ? 0xFFFFFF : 0xFFFF00;
					fill(pixels, flashColor, 0, barLength);
				}
				
				// Triple split rainbow (25% chance)
				if (Math.random() < 0.25) {
					const third = Math.floor(barLength / 3);
					for (let i = 0; i < barLength; i++) {
						const section = Math.floor(i / third);
						const hue = ((i + offset * (section + 1)) % 360);
						const rgb = hsvToRgb(hue, 1, intensityMultiplier * 0.7);
						const existingR = (pixels[i] >> 16) & 0xff;
						const existingG = (pixels[i] >> 8) & 0xff;
						const existingB = pixels[i] & 0xff;
						const newR = Math.min(255, existingR + rgb.r);
						const newG = Math.min(255, existingG + rgb.g);
						const newB = Math.min(255, existingB + rgb.b);
						pixels[i] = (newR << 16) | (newG << 8) | newB;
					}
				}
				
				// Extra random chaos pixels
				for (let chaos = 0; chaos < 10; chaos++) {
					if (Math.random() < 0.4) {
						const chaosPos = Math.floor(Math.random() * barLength);
						const chaosHue = Math.random() * 360;
						const chaosRgb = hsvToRgb(chaosHue, 1, intensityMultiplier);
						pixels[chaosPos] = (chaosRgb.r << 16) | (chaosRgb.g << 8) | chaosRgb.b;
					}
				}
			}

			offset++;
			ws281x.render();
		}, speed);

		logger.info('Rave mode started', { speed, mode, intensity });
		res.status(200).json({ message: 'ok', mode: 'rave started' });
	} catch (err) {
		logger.error('Error in raveController', { error: err.message, stack: err.stack, query: req.query });
		res.status(500).json({ error: 'There was a server error try again' });
	}
}

/**
 * POST /api/rave/stop - Stop the rave visuals
 */
async function raveStopController(req, res) {
	try {
		if (currentRaveInterval) {
			clearInterval(currentRaveInterval);
			currentRaveInterval = null;
			logger.info('Rave mode stopped');
			res.status(200).json({ message: 'ok', mode: 'rave stopped' });
		} else {
			res.status(200).json({ message: 'no active rave animation' });
		}
	} catch (err) {
		logger.error('Error in raveStopController', { error: err.message, stack: err.stack });
		res.status(500).json({ error: 'There was a server error try again' });
	}
}

/**
 * Convert HSV to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-1)
 * @param {number} v - Value (0-1)
 * @returns {{r: number, g: number, b: number}} RGB object
 */
function hsvToRgb(h, s, v) {
	const c = v * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = v - c;
	
	let r = 0, g = 0, b = 0;
	
	if (h >= 0 && h < 60) {
		r = c; g = x; b = 0;
	} else if (h >= 60 && h < 120) {
		r = x; g = c; b = 0;
	} else if (h >= 120 && h < 180) {
		r = 0; g = c; b = x;
	} else if (h >= 180 && h < 240) {
		r = 0; g = x; b = c;
	} else if (h >= 240 && h < 300) {
		r = x; g = 0; b = c;
	} else if (h >= 300 && h < 360) {
		r = c; g = 0; b = x;
	}
	
	return {
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255)
	};
}

async function progressController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');
		let {
			bg1,
			bg2,
			fg1,
			fg2,
			start = 0,
			length = config.barPixels,
			startingFill = 0,
			duration,
			easing = 'linear',
			interval = 50
		} = req.query;

		if (!bg1) {
			bg1 = '#000000';
		}

		if (!bg2) {
			bg2 = bg1;
		}

		if (!fg1) {
			fg1 = '#FFFFFF';
		}

		if (!fg2) {
			fg2 = fg1;
		}

		bg1 = textToHexColor(bg1);
		bg2 = textToHexColor(bg2);
		fg1 = textToHexColor(fg1);
		fg2 = textToHexColor(fg2);

		// Validate colors
		if (typeof bg1 == 'string') {
			res.status(400).json({ error: bg1 });
			return;
		}
		if (bg1 instanceof Error) throw bg1;

		if (typeof bg2 == 'string') {
			res.status(400).json({ error: bg2 });
			return;
		}
		if (bg2 instanceof Error) throw bg2;

		if (typeof fg1 == 'string') {
			res.status(400).json({ error: fg1 });
			return;
		}
		if (fg1 instanceof Error) throw fg1;

		if (typeof fg2 == 'string') {
			res.status(400).json({ error: fg2 });
			return;
		}
		if (fg2 instanceof Error) throw fg2;

		// Validate numeric parameters
		start = Number(start);
		length = Number(length);
		startingFill = Number(startingFill);
		interval = Number(interval);

		if (isNaN(start) || !Number.isInteger(start)) {
			res.status(400).json({ error: 'start must be an integer' });
			return;
		}
		if (isNaN(length) || !Number.isInteger(length)) {
			res.status(400).json({ error: 'length must be an integer' });
			return;
		}
		if (isNaN(startingFill) || startingFill < 0 || startingFill > 100) {
			res.status(400).json({ error: 'startingFill must be a number between 0 and 100' });
			return;
		}

		// Validate duration if provided
		if (duration !== undefined) {
			duration = Number(duration);
			if (isNaN(duration) || duration <= 0) {
				res.status(400).json({ error: 'duration must be a positive number' });
				return;
			}
		}

		// Cancel any existing progress animation
		if (currentProgressInterval) {
			clearInterval(currentProgressInterval);
			currentProgressInterval = null;
		}

		// Clear the bar section before starting animation
		fill(pixels, 0x000000, start, length);
		ws281x.render();

		animateProgress(start, length, startingFill, duration, interval, bg1, bg2, fg1, fg2);

		res.status(200).json({ message: 'ok' });
	} catch (err) {
		res.status(500).json({ error: 'There was a server error try again' });
	}
}

/**
 * Animate the progress bar from startingFill to 100%
 */
function animateProgress(start, length, startingFill, duration, interval, bg1, bg2, fg1, fg2) {
	const { pixels, ws281x } = require('../state');
	if (duration === undefined) {
		// No animation, just fill instantly to 100%
		gradient(pixels, bg1, bg2, start, length);
		gradient(pixels, fg1, fg2, start, length);
		ws281x.render();
		return;
	}

	const startTime = Date.now();
	const startPercent = startingFill;
	const endPercent = 100;

	currentProgressInterval = setInterval(() => {
		const elapsed = Date.now() - startTime;
		const progress = Math.min(elapsed / duration, 1);

		// Apply easing (linear for now, can add more later)
		const easedProgress = progress;

		// Calculate current fill percentage
		const currentPercent = startPercent + (endPercent - startPercent) * easedProgress;
		const fillLength = Math.floor((currentPercent / 100) * length);

		// Draw background gradient
		gradient(pixels, bg1, bg2, start, length);

		// Draw foreground gradient over the filled portion
		if (fillLength > 0) {
			gradient(pixels, fg1, fg2, start, fillLength);
		}

		ws281x.render();

		// Stop when animation is complete
		if (progress >= 1) {
			clearInterval(currentProgressInterval);
			currentProgressInterval = null;
		}
	}, interval);
}

/**
 * POST /api/fillByPercent - Fill a percentage of the LED strip with a fill color and background color
 */
async function fillByPercentController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');

		let { percent, fillColor, bgColor, length = config.barPixels } = req.query;

		fillColor = textToHexColor(fillColor);
		bgColor = textToHexColor(bgColor);

		// Validate fill colors
		if (typeof fillColor == 'string') {
			res.status(400).json({ error: fillColor });
			return;
		}
		if (fillColor instanceof Error) throw fillColor;

		if (typeof bgColor == 'string') {
			res.status(400).json({ error: bgColor });
			return;
		}
		if (bgColor instanceof Error) throw bgColor;

		// Validate percent
		percent = Number(percent);
		if (isNaN(percent) || percent < 0 || percent > 100) {
			res.status(400).json({ error: 'percent must be a number between 0 and 100' });
			return;
		}

		// Validate length
		length = Number(length);
		if (isNaN(length) || !Number.isInteger(length)) {
			res.status(400).json({ error: 'length must be an integer' });
			return;
		}

		// Use only the barPixels strip which starts at 0
		const startPos = 0;
		const stripLength = config.barPixels;

		// Make sure to clear the strip
		fill(pixels, 0x000000, startPos, stripLength);

		length = Math.min(length, stripLength);

		// Calculate length based on percent given
		let fillLength = Math.floor((percent / 100) * length);

		// Fill the strip
		fill(pixels, bgColor, startPos, length);
		fill(pixels, fillColor, startPos, fillLength);

		ws281x.render();
		logger.info('Fill by percent completed', { percent, fillColor: fillColor.toString(16), bgColor: bgColor.toString(16), length });
		res.status(200).json({ message: 'ok' });
	} catch (err) {
		logger.error('Error in fillByPercentController', { error: err.message, stack: err.stack, query: req.query });
		res.status(500).json({ error: 'There was a server error try again' });
	}
}

/**
 * POST /api/fill - Fill LED strip with a color
 */
async function fillController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');

		let { color, start = 0, length = pixels.length } = req.query

		color = textToHexColor(color)

		if (typeof color == 'string') {
			res.status(400).json({ error: color })
			return
		}
		if (color instanceof Error) throw color

		if (isNaN(start) || !Number.isInteger(Number(start))) {
			res.status(400).json({ error: 'start must be an integer' })
			return
		}
		if (isNaN(length) || !Number.isInteger(Number(length))) {
			res.status(400).json({ error: 'length must be an integer' })
			return
		}

		start = Number(start)
		length = Number(length)

		fill(pixels, color, start, length)
		ws281x.render()
		logger.info('Fill completed', { color: color.toString(16), start, length });
		res.status(200).json({ message: 'ok' })
	} catch (err) {
		logger.error('Error in fillController', { error: err.message, stack: err.stack, query: req.query });
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

/**
 * POST /api/gradient - Fill LED strip with a gradient
 */
async function gradientController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');

		let { startColor, endColor, start = 0, length = pixels.length } = req.query

		if (!startColor) {
			res.status(400).json({ error: 'missing startColor' })
			return
		}
		if (!endColor) {
			res.status(400).json({ error: 'missing endColor' })
			return
		}

		startColor = textToHexColor(startColor)

		if (typeof startColor == 'string') {
			res.status(400).json({ error: startColor })
			return
		}
		if (startColor instanceof Error) throw startColor

		endColor = textToHexColor(endColor)

		if (typeof endColor == 'string') {
			res.status(400).json({ error: endColor })
			return
		}
		if (endColor instanceof Error) throw endColor

		if (isNaN(start) || !Number.isInteger(Number(start))) {
			res.status(400).json({ error: 'start must be an integer' })
			return
		}
		if (isNaN(length) || !Number.isInteger(Number(length))) {
			res.status(400).json({ error: 'length must be an integer' })
			return
		}

		start = Number(start)
		length = Number(length)

		gradient(pixels, startColor, endColor, start, length)
		ws281x.render()
		logger.info('Gradient completed', { startColor: startColor.toString(16), endColor: endColor.toString(16), start, length });
		res.status(200).json({ message: 'ok' })
	} catch (err) {
		logger.error('Error in gradientController', { error: err.message, stack: err.stack, query: req.query });
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

/**
 * POST /api/setPixel - Set a single pixel color
 */
async function setPixelController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');

		let { pixel, color } = req.query

		color = textToHexColor(color)

		if (typeof color == 'string') {
			res.status(400).json({ error: color })
			return
		}
		if (color instanceof Error) throw color

		let pixelNumber = getPixelNumber(pixel, config.barPixels, config.boards)

		if (typeof pixelNumber == 'string') {
			res.status(400).json({ error: pixelNumber })
			return
		}
		if (pixelNumber instanceof Error) throw pixelNumber

		pixels[pixelNumber] = color

		ws281x.render()

		logger.info('Set pixel completed', { pixel, pixelNumber, color: color.toString(16) });
		res.status(200).json({ message: 'ok' })
	} catch (err) {
		logger.error('Error in setPixelController', { error: err.message, stack: err.stack, query: req.query });
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

/**
 * POST /api/setPixels - Set multiple pixel colors
 */
async function setPixelsController(req, res) {
	try {
		const { pixels, config, ws281x } = require('../state');
		const { safeJsonParse } = require('../utils/colorUtils');

		let inputPixels = req.query.pixels
		let tempPixels = structuredClone(pixels)

		if (!inputPixels) {
			res.status(400).json({ error: 'You did not provide any pixels' })
			return
		}
		
		inputPixels = safeJsonParse(inputPixels)

		if (typeof inputPixels == 'string') {
			res.status(400).json({ error: inputPixels })
			return
		}
		if (inputPixels instanceof Error) throw inputPixels

		for (let inputPixel of inputPixels) {
			let color = textToHexColor(inputPixel.color)
			let pixelNumber

			if (typeof color == 'string') {
				res.status(400).json({ error: color })
				return
			}
			if (color instanceof Error) throw color

			pixelNumber = getPixelNumber(inputPixel.pixelNumber, config.barPixels, config.boards)

			if (typeof pixelNumber == 'string') {
				res.status(400).json({ error: pixelNumber })
				return
			}
			if (pixelNumber instanceof Error) throw pixelNumber

			tempPixels[pixelNumber] = color
		}

		pixels.set(tempPixels)

		ws281x.render()

		logger.info('Set pixels completed', { count: inputPixels.length });
		res.status(200).json({ message: 'ok' })
	} catch (err) {
		logger.error('Error in setPixelsController', { error: err.message, stack: err.stack, query: req.query });
		res.status(500).json({ error: 'There was a server error try again' })
	}
}

module.exports = {
	fillController,
	fillByPercentController,
	gradientController,
	setPixelController,
	setPixelsController,
	progressController,
	raveController,
	raveStopController
};
