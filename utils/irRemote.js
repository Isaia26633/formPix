/**
 * IR Remote Controller for FormPix
 * Node.js conversion of the Python IR remote scripts
 * Uses the shared socket connection from the main app
 * 
 * Supports: NEC IR protocol (32-bit format)
 * Signal format: 9ms leader pulse + 32 data bits + stop bit
 * Bit encoding: ~560µs = '0', ~1.69ms = '1'
 * Threshold used for bit discrimination: 1000µs
 */

// GPIO libraries for Raspberry Pi.
// onoff uses legacy sysfs GPIO; pigpio works on newer stacks.
let OnOffGpio;
let PigpioGpio;
let rpio;

try {
    OnOffGpio = require('onoff').Gpio;
} catch (err) {
    OnOffGpio = null;
}

try {
    PigpioGpio = require('pigpio').Gpio;
} catch (err) {
    PigpioGpio = null;
}

try {
    rpio = require('rpio');
} catch (err) {
    rpio = null;
}

// IR button codes (hex values)
const BUTTONS = {
    'power': 0xffa25d,
    'vol_up': 0xff629d,
    'func': 0xffe21d,
    'rewind': 0xff22dd,
    'play_pause': 0xff02fd,
    'forward': 0xffc23d,
    'down': 0xffe01f,
    'vol_down': 0xffa857,
    'up': 0xff906f,
    '0': 0xff6897,
    'eq': 0xff9867,
    'repeat': 0xffb04f,
    '1': 0xff30cf,
    '2': 0xff18e7,
    '3': 0xff7a85,
    '4': 0xff10ef,
    '5': 0xff38c7,
    '6': 0xff5aa5,
    '7': 0xff42bd,
    '8': 0xff4ab5,
    '9': 0xff52ad
};

// Poll presets for each button
const POLL_PRESETS = {
    '1': {
        title: 'Done/Ready',
        answers: [{ answer: 'Done/ready?', weight: 1, color: '#00ff00' }]
    },
    '2': {
        title: 'True/False',
        answers: [
            { answer: 'True', weight: 1, color: '#00ff00' },
            { answer: 'False', weight: 1, color: '#ff0000' }
        ]
    },
    '3': {
        title: 'TUTD',
        answers: [
            { answer: 'Up', weight: 1, color: '#00ff00' },
            { answer: 'Wiggle', weight: 1, color: '#00ffff' },
            { answer: 'Down', weight: 1, color: '#ff0000' }
        ]
    },
    '4': {
        title: 'Multiple Choice',
        answers: [
            { answer: 'A', weight: 1, color: '#ff0000' },
            { answer: 'B', weight: 1, color: '#00ff00' },
            { answer: 'C', weight: 1, color: '#ffff00' },
            { answer: 'D', weight: 1, color: '#0000ff' }
        ]
    },
    '5': {
        title: 'Essay',
        answers: [{ answer: 'Submit Text', weight: 1, color: '#ff0000' }],
        type: 1 // Essay type
    }
};

class IRRemote {
    constructor(socket, pin = 27) {
        this.socket = socket;
        this.pin = pin;
        this.gpio = null;
        this.backend = null;
        this.lastCode = null;
        this.lastPressTime = 0;
        this.debounceMs = 200;
        this.running = false;
        this.pulses = [];
        this.lastPinState = 1;
        this.signalStartTime = null;
        this.signalTimeout = null;
    }

    /**
     * Initialize the IR remote listener
     */
    start() {
        const parsedPin = Number.parseInt(this.pin, 10);
        if (!Number.isInteger(parsedPin) || parsedPin < 0) {
            console.error(`[IR Remote] Invalid pin "${this.pin}" - skipping IR initialization`);
            return false;
        }
        this.pin = parsedPin;

        if (!OnOffGpio && !PigpioGpio && !rpio) {
            console.log('[IR Remote] No GPIO backend available. Install "onoff", "pigpio", or "rpio".');
            return false;
        }

        // Try rpio first (works on newer Pi OS without sysfs)
        if (rpio) {
            try {
                rpio.open(this.pin, rpio.INPUT);
                this.backend = 'rpio';
                this.running = true;

                console.log(`[IR Remote] Started listening on GPIO pin ${this.pin} via rpio`);

                // rpio doesn't have native interrupts, so we poll
                this.pollInterval = setInterval(() => {
                    const value = rpio.read(this.pin);
                    if (value !== this.lastPinState) {
                        this.handlePinChange(value);
                    }
                }, 0.05); // Poll every 50µs

                return true;
            } catch (err) {
                console.warn(`[IR Remote] rpio failed on GPIO ${this.pin}: ${err.message}`);
            }
        }

        let onoffError = null;
        if (OnOffGpio) {
            try {
                this.gpio = new OnOffGpio(this.pin, 'in', 'both');
                this.backend = 'onoff';
                this.running = true;

                console.log(`[IR Remote] Started listening on GPIO pin ${this.pin} via onoff`);

                this.gpio.watch((err, value) => {
                    if (err) {
                        console.error('[IR Remote] GPIO error:', err);
                        return;
                    }
                    this.handlePinChange(value);
                });

                return true;
            } catch (err) {
                onoffError = err;
                const isSysfsArgError =
                    err && (err.code === 'EINVAL' || `${err.message}`.toLowerCase().includes('invalid argument'));

                if (isSysfsArgError) {
                    console.warn(
                        `[IR Remote] onoff failed on GPIO ${this.pin}: ${err.message}. ` +
                        'This Raspberry Pi kernel likely has sysfs GPIO disabled.'
                    );
                } else {
                    console.warn(`[IR Remote] onoff failed on GPIO ${this.pin}: ${err.message}`);
                }
            }
        }

        if (PigpioGpio) {
            try {
                this.gpio = new PigpioGpio(this.pin, {
                    mode: PigpioGpio.INPUT,
                    alert: true
                });
                this.backend = 'pigpio';
                this.running = true;

                console.log(`[IR Remote] Started listening on GPIO pin ${this.pin} via pigpio`);

                this.gpio.on('alert', (level) => {
                    this.handlePinChange(level);
                });

                return true;
            } catch (err) {
                console.error('[IR Remote] Failed to initialize pigpio backend:', err.message);
                return false;
            }
        }

        if (onoffError) {
            console.error('[IR Remote] Failed to initialize GPIO:', onoffError.message);
            console.error('[IR Remote] Install pigpio for newer Raspberry Pi OS kernels: npm i pigpio');
        }

        return false;
    }

    /**
     * Handle GPIO pin state changes
     */
    handlePinChange(value) {
        const pinState = Number(value);
        if (pinState !== 0 && pinState !== 1) {
            return;
        }

        const now = process.hrtime.bigint();

        if (pinState === 0 && this.lastPinState === 1) {
            // Falling edge - start of signal
            this.signalStartTime = now;
        } else if (pinState === 1 && this.lastPinState === 0 && this.signalStartTime) {
            // Rising edge - end of low pulse
            const duration = Number(now - this.signalStartTime) / 1000; // Convert to microseconds
            
            if (duration > 100) {
                this.pulses.push(duration);
            }

            // Check if we have enough pulses for a complete signal
            if (this.pulses.length >= 33) {
                this.processSignal();
            }

            // Reset signal start time for next measurement
            this.signalStartTime = now;

            // Set timeout to process partial signals
            clearTimeout(this.signalTimeout);
            this.signalTimeout = setTimeout(() => {
                if (this.pulses.length >= 33) {
                    this.processSignal();
                }
                this.pulses = [];
            }, 50);
        }

        this.lastPinState = pinState;
    }

    /**
     * Process the collected IR signal pulses
     */
    processSignal() {
        if (this.pulses.length < 33) {
            this.pulses = [];
            return;
        }

        // Skip first pulse (leader) and get 32 data bits
        const dataPulses = this.pulses.slice(1, 33);
        
        let binary = '';
        for (const pulse of dataPulses) {
            binary += pulse > 1000 ? '1' : '0';
        }

        if (binary.length !== 32) {
            this.pulses = [];
            return;
        }

        try {
            const code = parseInt(binary, 2);
            this.handleButtonPress(code);
        } catch (err) {
            console.debug('[IR Remote] Failed to parse binary IR code', { binary, error: err });
        }

        this.pulses = [];
    }

    /**
     * Handle a detected button press
     */
    handleButtonPress(code) {
        const now = Date.now();
        const hexCode = '0x' + code.toString(16);

        // Debounce: ignore same button pressed within debounceMs
        if (code === this.lastCode && now - this.lastPressTime < this.debounceMs) {
            return;
        }

        this.lastCode = code;
        this.lastPressTime = now;

        // Find matching button
        for (const [name, buttonCode] of Object.entries(BUTTONS)) {
            if (code === buttonCode) {
                console.log(`[IR Remote] Button pressed: ${name}`);
                this.executeAction(name);
                return;
            }
        }

        console.log(`[IR Remote] Unknown code: ${hexCode}`);
    }

    /**
     * Execute action for a button press
     */
    executeAction(buttonName) {
        if (!this.socket || !this.socket.connected) {
            console.log('[IR Remote] Socket not connected - cannot execute action');
            return;
        }

        const preset = POLL_PRESETS[buttonName];
        
        if (preset) {
            // Start a poll with the preset
            const pollType = preset.type || 0;
            try {
                this.socket.emit('startPoll', [
                    0,                  // pollId
                    pollType,           // type (0 = choice, 1 = essay)
                    preset.title,       // title
                    preset.answers,     // answers array
                    false,              // anonymous
                    1,                  // weight
                    [],                 // include
                    [],                 // exclude
                    [],                 // tags
                    [],                 // groups
                    false,              // allowMultiple
                    true                // showResults
                ]);
                console.log(`[IR Remote] Started poll: ${preset.title}`);
            } catch (err) {
                console.error('[IR Remote] Failed to emit "startPoll":', err);
            }
        } else if (buttonName === 'play_pause') {
            // Toggle/update poll
            try {
                this.socket.emit('updatePoll', {});
                console.log('[IR Remote] Updated poll');
            } catch (err) {
                console.error('[IR Remote] Failed to emit "updatePoll":', err);
            }
        }
    }

    /**
     * Stop the IR remote listener
     */
    stop() {
        clearTimeout(this.signalTimeout);
        this.running = false;
        
        if (this.gpio) {
            if (this.backend === 'onoff') {
                if (typeof this.gpio.unwatchAll === 'function') {
                    this.gpio.unwatchAll();
                }
                this.gpio.unexport();
            } else if (this.backend === 'pigpio') {
                this.gpio.removeAllListeners('alert');
                if (typeof this.gpio.disableAlert === 'function') {
                    this.gpio.disableAlert();
                }
            }
            this.gpio = null;
            this.backend = null;
        }

        console.log('[IR Remote] Stopped');
    }
}

module.exports = { IRRemote, BUTTONS, POLL_PRESETS };
