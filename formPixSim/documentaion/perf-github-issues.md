# Performance & Architecture GitHub Issues

This file collects ready-to-copy GitHub issues derived from the remaining items in `inefficiencies.md`.

---

## Issue 1: Optimize HSV→RGB in rave with extended LUT/memoization

**Summary**  
Rave animations still spend significant CPU in HSV→RGB conversion. We already have a 360-entry hue LUT for `s = 1, v = 1`, but many calls still hit the slower fallback path.

**Context**  
- Rave effects live in `controllers/raveControllers.js`.  
- See "HSV to RGB conversion in rave animations" in `formPixSim/documentaion/inefficiencies.md`.

**Tasks**  
- Profile rave modes to identify dominant `(h, s, v)` combinations in practice.  
- Extend `HUE_LUT_FULL_SAT` or add additional LUTs (e.g., quantized `v` steps, small `s` set) to cover the most common cases.  
- Optionally memoize recent `(h, s, v)` tuples for modes that reuse similar values.  
- Ensure visual output is unchanged or acceptable (no banding).  
- Re-profile to confirm CPU savings in rave-heavy scenarios.

**Acceptance Criteria**  
- Most rave `hsvToRgb` calls hit LUT/memoized fast paths instead of the full math path.  
- Measurable CPU reduction in rave modes (target: 50–70% in HSV hot paths).  
- No visible regressions in rainbow, strobe, pulse, chase, or crazy modes.  

---

## Issue 2: Refactor rave mode dispatch to use a handler table

**Summary**  
Rave mode logic currently uses repeated string comparisons (`if (mode === 'rainbow')`, etc.) inside the animation interval; this is re-evaluated every frame.

**Context**  
- Mode branching and animation loop live in `controllers/raveControllers.js`.  
- See "Repeated string comparisons in rave mode branches" in `formPixSim/documentaion/inefficiencies.md`.

**Tasks**  
- Extract per-mode draw functions (e.g., `drawRainbow`, `drawStrobe`, `drawPulse`, `drawChase`, `drawCrazy`).  
- Build a dispatch table:  
  - `const HANDLERS = { rainbow: drawRainbow, strobe: drawStrobe, ... }`.  
- Resolve the mode to a handler once per request, before starting the interval.  
- Inside `setInterval`, call the selected handler directly instead of checking `mode` every tick.  
- Handle invalid/unknown modes with a safe fallback.

**Acceptance Criteria**  
- No per-frame `if/else` or `switch` on `mode` in the rave interval body.  
- Behavior of existing modes remains the same.  
- Small but measurable CPU improvement in rave loops (especially at high FPS).  

---

## Issue 3: Centralize random helpers and reduce per-frame `Math.random()` noise

**Summary**  
Random effects in rave and poll handlers currently use many inline `Math.random()` patterns and repeated "pick random element" logic.

**Context**  
- Rave randomness: `controllers/raveControllers.js`.  
- Poll text randomness: `sockets/pollHandlers.js`.  
- See issues "Inline Math.random() calls without state reuse" and "Random array selection pattern" in `formPixSim/documentaion/inefficiencies.md`.

**Tasks**  
- Add a small utility module (e.g., `utils/helpers.js` or similar) with:  
  - `pickRandom(arr)`  
  - `getRandomInt(min, max)`  
- Replace inline `text[Math.floor(Math.random() * text.length)]` and similar patterns with `pickRandom`.  
- Where appropriate, generate random values once per frame and reuse them instead of calling `Math.random()` multiple times inside the same loop.  
- Optionally add a deterministic PRNG option for debugging (seeded).

**Acceptance Criteria**  
- All repeated "pick a random element" and integer-range random patterns use shared helpers.  
- Fewer `Math.random()` calls inside per-frame loops in rave modes.  
- Behavior is unchanged but code is cleaner and easier to tweak.  

---

## Issue 4: Decouple rave controller from pixel interval state & chaser presets

**Summary**  
Rave controller logic has tight cross-module coupling to pixelControllers’ interval state and uses magic numbers for chaser presets (speed, size, hue offsets, direction).

**Context**  
- Interval coupling: `controllers/raveControllers.js`.  
- Progress animation state: `controllers/pixelControllers.js`.  
- See "Rave controller cross-module interval state coupling" and "Inline hue offset calculations / Magic numbers" in `formPixSim/documentaion/inefficiencies.md`.

**Tasks**  
- Move shared interval state (e.g., current progress interval, rave interval) into `state.js` or a dedicated interval manager module.  
- Expose clean helper functions (e.g., `startRave`, `stopRave`, `startProgress`, `stopProgress`) instead of directly mutating other controllers’ internals.  
- Extract chaser presets into a config object at the top of `controllers/raveControllers.js`:  
  - e.g., `const CHASER_PRESETS = [...]` with speed, size, hueOffset, direction.  
- Use a small factory function for chasers instead of inlined object literals.

**Acceptance Criteria**  
- No direct mutation of another controller’s module-level interval variables from raveControllers.  
- Chaser configuration lives in one place and is easy to tweak.  
- Rave and progress modes still start/stop correctly and don’t fight each other.  

---

## Issue 5: Make sound loading non-blocking at startup

**Summary**  
Sound file list is loaded synchronously at startup using `fs.readdirSync`, which blocks the event loop.

**Context**  
- Sound utilities: `utils/soundUtils.js`.  
- State initialization: `state.js`.  
- See "Sound file list loaded at startup with fs.readdirSync" in `formPixSim/documentaion/inefficiencies.md`.

**Tasks**  
- Replace `fs.readdirSync` usage in `loadSounds()` with `fs.promises.readdir` or an async wrapper.  
- Update `state.js` to initialize `sounds` asynchronously, or lazy-load on first use.  
- Ensure callers handle the async contract (e.g., await a `loadSounds()` promise during boot).  
- Keep behavior identical: the same set of sounds must be available once the app is "ready".

**Acceptance Criteria**  
- No blocking `readdirSync` in sound initialization paths.  
- Application boots without noticeable delay from sound scanning.  
- All existing sound features still work and see the full sound list.  

---

## Issue 6: Consolidate display color parsing and defaults

**Summary**  
Display controllers repeatedly call `textToHexColor` and re-parse default colors inline on each API call.

**Context**  
- Display routes: `controllers/displayControllers.js`.  
- Color utilities: `utils/colorUtils.js`.  
- See "Text color parsing in displayControllers inline" and "Color parsing pattern" sections in `formPixSim/documentaion/inefficiencies.md`.

**Tasks**  
- Add module-scope constants in `controllers/displayControllers.js` for default text and background colors (pre-parsed hex values).  
- Extract a small helper (e.g., `parseColorOrDefault(value, fallback)`) to handle parsing, error reporting, and fallback.  
- Replace repeated `textToHexColor` + error checks with the helper.  
- Optionally share the same helper with pixel controllers for their color parsing.

**Acceptance Criteria**  
- No repeated inline `textToHexColor` + error handling boilerplate for defaults.  
- Fewer color parsing calls per request; defaults come from constants.  
- Display endpoints behave exactly as before, with clearer error messages where applicable.  

---

## Issue 7: Fix interval cleanup to avoid stale boardIntervals entries

**Summary**  
Socket connection error handling rebinds `boardIntervals` using `filter`, which doesn’t mutate the shared array in state and can leave stale intervals around.

**Context**  
- Connection handlers: `sockets/connectionHandlers.js`.  
- See "Interval cleanup: stale array entries" in `formPixSim/documentaion/inefficiencies.md`.

**Tasks**  
- Update `handleConnectError` (and any related paths) to:  
  - Clear each interval via `clearInterval`.  
  - Mutate the shared `boardIntervals` array in place (`splice` or `length = 0`).  
- Confirm that subsequent connections don’t re-use stale interval references.  
- Ensure no double-clearing or crashes when reconnecting repeatedly.

**Acceptance Criteria**  
- After a disconnect, `state.boardIntervals` is truly empty and contains no stale objects.  
- No memory growth from abandoned intervals after multiple connect/disconnect cycles.  

---

## Issue 8: Centralize display message state updates

**Summary**  
Display controllers set `state.currentDisplayMessage` and `state.lastDisplayUpdate` inline, scattering state logic across endpoints.

**Context**  
- Display controllers: `controllers/displayControllers.js`.  
- Global state: `state.js`.  
- See "Display message state not consolidated" in `formPixSim/documentaion/inefficiencies.md`.

**Tasks**  
- Add a helper in `state.js` or a small state utility module:  
  - e.g., `setDisplayMessage(message, options)` that updates message text and timestamp.  
- Refactor all places that currently set `currentDisplayMessage` / `lastDisplayUpdate` manually to use this helper.  
- Optionally track additional metadata (e.g., source route, priority) via the helper.

**Acceptance Criteria**  
- No direct writes to `state.currentDisplayMessage` or `state.lastDisplayUpdate` outside the helper.  
- Display message updates are consistent and easy to trace.  

---

## Issue 9: Optimize poll handler deep equality and response aggregation

**Summary**  
Poll socket handler uses `util.isDeepStrictEqual` on the whole poll object and recomputes response aggregation in multiple loops.

**Context**  
- Poll handlers: `sockets/pollHandlers.js`.  
- See "Deep equality check in poll updates" and related notes in `formPixSim/documentaion/inefficiencies.md`.

**Tasks**  
- Replace `util.isDeepStrictEqual(newPollData, pollData)` with a cheaper comparison:  
  - Compare only relevant fields (e.g., `status`, `totalResponses`, `totalResponders`, and a hash or length of `responses`).  
- Refactor response aggregation so `Object.values(newPollData.responses)` is computed once and reused for sums, counts, and special-case checks.  
- Reuse the random helper (`pickRandom`) for any random poll text selection.  

**Acceptance Criteria**  
- No more full deep-equality checks on entire poll objects on every event.  
- Only necessary fields are compared; poll updates still trigger when they should.  
- Response totals and special cases (e.g. specific "Thumbs?" patterns) still behave correctly.  

---

## Issue 10: Hoist state requires & add a shared query parsing helper

**Summary**  
Some controllers and socket handlers call `require('../state')` inside callbacks and repeat `Number()` conversions for query params.

**Context**  
- Poll handlers: `sockets/pollHandlers.js`.  
- Pixel controllers: `controllers/pixelControllers.js`.  
- See "State requires inside callbacks" and "Number() conversion repeated in loops" in `formPixSim/documentaion/inefficiencies.md`.

**Tasks**  
- Move `require('../state')` calls to module scope for all affected files, and thread specific pieces (pixels, config, etc.) via parameters where needed.  
- Introduce a shared helper (e.g., `parseQueryParams(query, schema)`) in a small utility module to centralize numeric parsing and validation.  
- Update controllers like `percentage`, `progress`, and `fillByPercent` to use the helper instead of repeated `Number()` and `isNaN` patterns.  

**Acceptance Criteria**  
- No `require('../state')` inside hot-path callbacks.  
- Numeric query parsing is consistent and uses a single helper.  
- All existing API routes continue to validate and behave the same from a client’s perspective.  
