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

// Define log format
const logFormat = winston.format.combine(
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.errors({ stack: true }),
	winston.format.printf(({ timestamp, level, message, stack }) => {
		if (stack) {
			return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
		}
		return `${timestamp} [${level.toUpperCase()}]: ${message}`;
	})
);

// Console format with colors
const consoleFormat = winston.format.combine(
	winston.format.colorize(),
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.printf(({ timestamp, level, message, stack }) => {
		if (stack) {
			return `${timestamp} [${level}]: ${message}\n${stack}`;
		}
		return `${timestamp} [${level}]: ${message}`;
	})
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
process.on('unhandledRejection', (reason, promise) => {
	logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
	logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
	process.exit(1);
});

module.exports = logger;
