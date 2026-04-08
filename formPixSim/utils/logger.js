/**
 * Winston Logger Configuration
 * Creates logs folder and log files with rotation
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Format a log entry for file output.
 * @param {{timestamp: string, level: string, message: string, stack?: string}} entry - Winston log entry.
 * @returns {string} Formatted log line.
 */
function formatFileLogEntry({ timestamp, level, message, stack }) {
	if (stack) {
		return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
	}
	return `${timestamp} [${level.toUpperCase()}]: ${message}`;
}

/**
 * Format a log entry for colored console output.
 * @param {{timestamp: string, level: string, message: string, stack?: string}} entry - Winston log entry.
 * @returns {string} Formatted console log line.
 */
function formatConsoleLogEntry({ timestamp, level, message, stack }) {
	if (stack) {
		return `${timestamp} [${level}]: ${message}\n${stack}`;
	}
	return `${timestamp} [${level}]: ${message}`;
}

/**
 * Handle unhandled Promise rejections.
 * @param {unknown} reason - Rejection reason.
 * @param {Promise<unknown>} promise - Rejected promise.
 * @returns {void}
 */
function handleUnhandledRejection(reason, promise) {
	logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
}

/**
 * Handle uncaught exceptions.
 * @param {Error} error - Thrown error.
 * @returns {void}
 */
function handleUncaughtException(error) {
	logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
	process.exit(1);
}

// Define log format
const logFormat = winston.format.combine(
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.errors({ stack: true }),
	winston.format.printf(formatFileLogEntry)
);

// Console format with colors
const consoleFormat = winston.format.combine(
	winston.format.colorize(),
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.printf(formatConsoleLogEntry)
);

// Daily rotate file transport for all logs
const allLogsTransport = new DailyRotateFile({
	filename: path.join(logsDir, 'app-%DATE%.log'),
	datePattern: 'YYYY-MM-DD',
	maxSize: '20m',
	maxFiles: '14d',
	format: logFormat,
	level: 'debug'
});

// Daily rotate file transport for error logs
const errorLogsTransport = new DailyRotateFile({
	filename: path.join(logsDir, 'error-%DATE%.log'),
	datePattern: 'YYYY-MM-DD',
	maxSize: '20m',
	maxFiles: '30d',
	format: logFormat,
	level: 'error'
});

// Create logger instance
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || 'info',
	format: logFormat,
	transports: [
		allLogsTransport,
		errorLogsTransport,
		new winston.transports.Console({
			format: consoleFormat
		})
	],
	exitOnError: false
});

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', handleUnhandledRejection);

process.on('uncaughtException', handleUncaughtException);

module.exports = logger;
