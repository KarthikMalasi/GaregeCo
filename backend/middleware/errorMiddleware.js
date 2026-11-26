class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const keys = Object.keys(err.keyPattern || err.keyValue || {});
    if (keys.includes('garage') && keys.includes('appointmentDate') && keys.includes('timeSlot')) {
      message = 'This garage time slot is already booked for the selected date';
    } else if (keys.length > 0) {
      message = `Duplicate value for ${keys.join(', ')}. Please use a different value.`;
    } else {
      message = 'Duplicate entry detected';
    }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};

module.exports = { AppError, notFound, errorHandler };
