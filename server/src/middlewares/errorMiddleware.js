const AppError = require('../utils/appError');

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // Production Error Handling
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: `${field.toUpperCase()} already exists.`
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    return res.status(400).json({
      success: false,
      status: 'fail',
      message: `Invalid input data: ${errors.join('. ')}`
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Your token has expired. Please log in again.' });
  }

  // Fallback for unhandled programming errors
  console.error('[Unhandled Fatal Error]', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Something went wrong on the server.'
  });
};

module.exports = globalErrorHandler;
