/**
 * IR Remote Controller for FormPix
 * Node.js conversion of the Python IR remote scripts
 * Uses the shared socket connection from the main app
 */

// GPIO library for Raspberry Pi (install with: npm install onoff)
let Gpio;
try {
    Gpio = require('onoff').Gpio;
} catch (err) {
    console.warn('[IR Remote] onoff module not available - IR functionality disabled');
    Gpio = null;
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
    constructor(socket, pin = 4) {
        this.socket = socket;
        this.pin = pin;
        this.gpio = null;
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
        if (!Gpio) {
            console.log('[IR Remote] GPIO not available - skipping IR initialization');
            return false;
        }

        try {
            this.gpio = new Gpio(this.pin, 'in', 'both');
            this.running = true;

            console.log(`[IR Remote] Started listening on GPIO pin ${this.pin}`);

            // Watch for GPIO changes
            this.gpio.watch((err, value) => {
                if (err) {
                    console.error('[IR Remote] GPIO error:', err);
                    return;
                }
                this.handlePinChange(value);
            });

            return true;
        } catch (err) {
            console.error('[IR Remote] Failed to initialize GPIO:', err.message);
            return false;
        }
    }

    /**
     * Handle GPIO pin state changes
     */
    handlePinChange(value) {
        const now = process.hrtime.bigint();

        if (value === 0 && this.lastPinState === 1) {
            // Falling edge - start of signal
            this.signalStartTime = now;
        } else if (value === 1 && this.lastPinState === 0 && this.signalStartTime) {
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

        this.lastPinState = value;
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
        } else if (buttonName === 'play_pause') {
            // Toggle/update poll
            this.socket.emit('updatePoll', {});
            console.log('[IR Remote] Updated poll');
        }
    }

    /**
     * Stop the IR remote listener
     */
    stop() {
        this.running = false;
        
        if (this.gpio) {
            this.gpio.unexport();
            this.gpio = null;
        }

        console.log('[IR Remote] Stopped');
    }
}

module.exports = { IRRemote, BUTTONS, POLL_PRESETS };
