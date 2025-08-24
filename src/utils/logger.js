import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define format for file logs (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Add request logging middleware
export const requestLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/requests.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add error logging middleware
export const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/errors.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add security logging middleware
export const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/security.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add audit logging middleware
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/audit.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Helper functions for structured logging
export const logUserAction = (userId, action, details = {}) => {
  logger.info('User action', {
    userId,
    action,
    timestamp: new Date().toISOString(),
    ...details,
  });
  
  auditLogger.info('User action', {
    userId,
    action,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

export const logSecurityEvent = (event, details = {}) => {
  logger.warn('Security event', {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
  
  securityLogger.warn('Security event', {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

export const logSubmissionEvent = (submissionId, event, details = {}) => {
  logger.info('Submission event', {
    submissionId,
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
  
  auditLogger.info('Submission event', {
    submissionId,
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

export const logPaymentEvent = (transactionId, event, details = {}) => {
  logger.info('Payment event', {
    transactionId,
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
  
  auditLogger.info('Payment event', {
    transactionId,
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Export the main logger
export { logger as default, logger };

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/exceptions.log'),
    format: fileFormat,
  })
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/rejections.log'),
    format: fileFormat,
  })
);