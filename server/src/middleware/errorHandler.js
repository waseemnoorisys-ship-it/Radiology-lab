import { ZodError } from 'zod';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000 && err.keyValue) {
    const duplicateField = Object.keys(err.keyValue)[0];
    const duplicateValue = err.keyValue[duplicateField];
    res.status(409).json({
      success: false,
      error: `Duplicate entry for ${duplicateField}: '${duplicateValue}' already exists`,
      field: duplicateField,
    });
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId or format)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid identifier format provided',
    });
    return;
  }

  // Handle Zod Validation Error (fallback if unhandled)
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors,
    });
    return;
  }

  // General server error
  console.error(`[Error] ${req.method} ${req.url} ->`, err);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
