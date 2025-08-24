import { logger, errorLogger } from '../utils/logger.js';

/**
 * Custom error classes
 */
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, true);
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, true);
  }
}

/**
 * Main error handling middleware
 */
export function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log error
  errorLogger.error('Error occurred', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.userId || 'anonymous',
    },
    timestamp: new Date().toISOString(),
  });

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }

  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = new ValidationError(message);
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value';
    error = new ConflictError(message);
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AuthenticationError(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AuthenticationError(message);
  }

  if (err.name === 'MulterError') {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }
    error = new ValidationError(message);
  }

  // Handle database errors
  if (err.code === '23505') { // Unique violation
    const message = 'Resource already exists';
    error = new ConflictError(message);
  }

  if (err.code === '23503') { // Foreign key violation
    const message = 'Referenced resource does not exist';
    error = new ValidationError(message);
  }

  if (err.code === '23514') { // Check violation
    const message = 'Invalid data provided';
    error = new ValidationError(message);
  }

  // Handle AWS S3 errors
  if (err.code === 'NoSuchKey') {
    const message = 'File not found';
    error = new NotFoundError(message);
  }

  if (err.code === 'AccessDenied') {
    const message = 'Access denied to file';
    error = new AuthorizationError(message);
  }

  // Handle Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    let message = 'Payment processing error';
    let statusCode = 400;

    switch (err.type) {
      case 'StripeCardError':
        message = err.message || 'Card error';
        break;
      case 'StripeInvalidRequestError':
        message = err.message || 'Invalid request';
        break;
      case 'StripeAPIError':
        message = 'Payment service error';
        statusCode = 502;
        break;
      case 'StripeConnectionError':
        message = 'Payment service connection error';
        statusCode = 503;
        break;
      case 'StripeAuthenticationError':
        message = 'Payment service authentication error';
        statusCode = 502;
        break;
      default:
        message = err.message || 'Payment error';
    }

    error = new AppError(message, statusCode);
  }

  // Handle Redis errors
  if (err.code === 'ECONNREFUSED' && err.syscall === 'connect') {
    const message = 'Cache service unavailable';
    error = new AppError(message, 503);
  }

  // Handle PostgreSQL connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    const message = 'Database service unavailable';
    error = new AppError(message, 503);
  }

  // Set default values if not set
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Determine if we should expose error details
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isOperational = error.isOperational !== false;

  // Build error response
  const errorResponse = {
    error: {
      message: isDevelopment || isOperational ? message : 'Internal Server Error',
      status: error.status || 'error',
      ...(isDevelopment && {
        stack: err.stack,
        details: error.details,
        code: error.code,
        name: error.name,
      }),
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);

  // Log final error details
  logger.error('Error response sent', {
    statusCode,
    message,
    path: req.originalUrl,
    method: req.method,
    userId: req.userId || 'anonymous',
    isOperational,
  });
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error boundary for unhandled promise rejections
 */
export function handleUnhandledRejection(reason, promise) {
  errorLogger.error('Unhandled Rejection at Promise', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
    timestamp: new Date().toISOString(),
  });

  // In production, you might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

/**
 * Error boundary for uncaught exceptions
 */
export function handleUncaughtException(error) {
  errorLogger.error('Uncaught Exception', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    timestamp: new Date().toISOString(),
  });

  // Exit the process for uncaught exceptions
  process.exit(1);
}

// Set up global error handlers
process.on('unhandledRejection', handleUnhandledRejection);
process.on('uncaughtException', handleUncaughtException);

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleUnhandledRejection,
  handleUncaughtException,
};