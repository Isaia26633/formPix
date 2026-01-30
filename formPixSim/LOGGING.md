# Winston Logging System Documentation

## Overview
A comprehensive Winston logging system has been implemented for the FormPixSim application. The system automatically creates a `logs/` directory and generates daily rotating log files.

## Features

### 1. Log Directory Structure
- **Location**: `./logs/` (created automatically if it doesn't exist)
- **Files**:
  - `app-YYYY-MM-DD.log` - All logs (debug, info, warn, error)
  - `error-YYYY-MM-DD.log` - Error logs only
  - Audit files for log rotation tracking

### 2. Log Rotation
- **Daily rotation**: New log files created each day
- **Max file size**: 20MB per file
- **Retention**: 
  - General logs: 14 days
  - Error logs: 30 days
- Files automatically deleted after retention period

### 3. Log Levels
The logger supports multiple log levels:
- **error**: Critical errors and exceptions
- **warn**: Warning messages (e.g., failed validations, connection issues)
- **info**: General informational messages (e.g., API requests, successful operations)
- **debug**: Detailed debugging information (e.g., timer updates, sound events)

Default level: `info` (can be changed via `LOG_LEVEL` environment variable)

### 4. Log Format
```
YYYY-MM-DD HH:mm:ss [LEVEL]: message
```
For errors with stack traces:
```
YYYY-MM-DD HH:mm:ss [ERROR]: message
<stack trace>
```

## Implementation Details

### Core Logger (`utils/logger.js`)
- Winston configuration with daily rotation
- Console output with colors
- File output without colors
- Automatic error stack trace capture
- Handles unhandled rejections and uncaught exceptions

### Logging Coverage

#### 1. Main Application (`app.js`)
- Server startup
- Browser client connections

#### 2. Middleware
- **checkConnection.js**: Connection status checks
- **checkPermissions.js**: Permission validation, API key issues
- **validateQueryParams.js**: Query parameter validation
- **handle404.js**: 404 errors

#### 3. Controllers
- **pixelControllers.js**: All pixel operations (fill, gradient, setPixel, etc.)
- **displayControllers.js**: Display/text operations
- **soundControllers.js**: Sound playback operations
- **infoControllers.js**: System info requests

#### 4. Socket Handlers
- **connectionHandlers.js**: FormBar connection status, class changes
- **soundHandlers.js**: Socket-based sound events
- **pollHandlers.js**: Poll updates and changes
- **timerHandlers.js**: Timer events

## Usage Examples

### In Controllers
```javascript
const logger = require('../utils/logger');

// Info logging
logger.info('Operation completed', { param1: value1, param2: value2 });

// Error logging
logger.error('Operation failed', { error: err.message, stack: err.stack });

// Warning logging
logger.warn('Validation failed', { field: 'apiKey', url: req.url });
```

### In Socket Handlers
```javascript
const logger = require('../utils/logger');

logger.info('Connected to FormBar successfully');
logger.debug('Timer update', { timeLeft: time, startTime: start });
```

## Environment Configuration

You can set the log level via environment variable in `.env`:
```
LOG_LEVEL=debug
```

Available levels: `error`, `warn`, `info`, `debug`

## Monitoring Logs

### View recent logs in real-time:
```bash
Get-Content logs\app-2026-01-16.log -Tail 50 -Wait
```

### View error logs only:
```bash
Get-Content logs\error-2026-01-16.log
```

### Search for specific errors:
```bash
Select-String -Path "logs\*.log" -Pattern "error message"
```

## Benefits

1. **Comprehensive Coverage**: All console.log statements replaced with appropriate logger calls
2. **Structured Logging**: Context-rich logs with metadata
3. **Automatic Rotation**: No manual log file management needed
4. **Error Tracking**: Dedicated error log files with stack traces
5. **Production Ready**: Configurable log levels and retention policies
6. **No Data Loss**: Unhandled exceptions and rejections are captured

## Notes

- Logs are NOT committed to git (should be in `.gitignore`)
- Console output includes colors for better readability during development
- File logs are plain text for easy parsing and analysis
- All timestamps are in local time
- Log files are automatically created on first write
