// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AuthRequest } from './auth.middleware';
import { env } from '../config/env';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // Log error
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: (req as AuthRequest).user?.id,
    timestamp: new Date().toISOString(),
  });

  // Handle custom AppError
  if (err instanceof AppError) {
    const response: any = {
      success: false,
      message: err.message,
    };

    if (env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          message: `Duplicate field value: ${err.meta?.target || 'unique constraint'}`,
        });
      case 'P2003':
        return res.status(409).json({
          success: false,
          message: 'Related record not found',
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: 'Record not found',
        });
      case 'P2012':
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${err.meta?.field}`,
        });
      default:
        return res.status(500).json({
          success: false,
          message: env.NODE_ENV === 'production'
            ? 'Database error occurred'
            : `Database error: ${err.message}`,
        });
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please login again',
    });
  }

  // Default error
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Async wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
export const notFound = (req: Request, res: Response): Response => {
  return res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`,
  });
};

// Error factories
export const createError = (message: string, statusCode: number): AppError => {
  return new AppError(message, statusCode);
};

export const badRequest = (message: string): AppError => {
  return new AppError(message, 400);
};

export const unauthorized = (message: string = 'Unauthorized'): AppError => {
  return new AppError(message, 401);
};

export const forbidden = (message: string = 'Forbidden'): AppError => {
  return new AppError(message, 403);
};

export const notFoundError = (message: string = 'Not found'): AppError => {
  return new AppError(message, 404);
};