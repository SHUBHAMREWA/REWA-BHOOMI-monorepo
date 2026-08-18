import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../errors/AppError';
import { logger } from '../config/logger';
import { env } from '../config/env';

// ─── Success Response Helper ────────────────────────────────────────────────────

export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
}

// ─── Global Error Handler ───────────────────────────────────────────────────────

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError('Validation failed', err.flatten());
    return res.status(422).json({
      success: false,
      error: {
        code: validationError.code,
        message: validationError.message,
        details: validationError.details,
      },
    });
  }

  // Handle operational app errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path, method: req.method }, err.message);
    } else {
      logger.warn({ code: err.code, path: req.path }, err.message);
    }

    const response: Record<string, unknown> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err instanceof ValidationError && err.details) {
      (response.error as Record<string, unknown>).details = err.details;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle unexpected errors
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
}

// ─── 404 Handler ───────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

// ─── Async Handler Wrapper ──────────────────────────────────────────────────────

export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
