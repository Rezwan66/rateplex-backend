import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';
import { ZodError } from 'zod';

// ─── Prisma error detection ────────────────────────────────────
interface PrismaKnownError {
  code: string;
  message: string;
  meta?: Record<string, unknown>;
}

const isPrismaError = (error: unknown): error is PrismaKnownError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as PrismaKnownError).code === 'string' &&
    (error as PrismaKnownError).code.startsWith('P')
  );
};

const handlePrismaError = (error: PrismaKnownError) => {
  switch (error.code) {
    case 'P2002':
      return {
        statusCode: status.CONFLICT,
        message: 'Duplicate value: a record with this data already exists.',
      };
    case 'P2025':
      return {
        statusCode: status.NOT_FOUND,
        message: 'Record not found.',
      };
    case 'P2003':
      return {
        statusCode: status.BAD_REQUEST,
        message: 'Related record not found (foreign key constraint failed).',
      };
    default:
      return {
        statusCode: status.INTERNAL_SERVER_ERROR,
        message: 'A database error occurred.',
      };
  }
};

// ─── Zod error handling ─────────────────────────────────────────
const handleZodError = (error: ZodError) => {
  const issues = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  return {
    statusCode: status.BAD_REQUEST,
    message: `Validation error: ${issues.map((i) => i.message).join(', ')}`,
  };
};

// ─── JWT error handling ─────────────────────────────────────────
const isJwtError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    ((error as Error).name === 'JsonWebTokenError' ||
      (error as Error).name === 'TokenExpiredError' ||
      (error as Error).name === 'NotBeforeError')
  );
};

const handleJwtError = (error: Error) => {
  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: status.UNAUTHORIZED,
      message: 'Token has expired. Please log in again.',
    };
  }
  return {
    statusCode: status.UNAUTHORIZED,
    message: 'Invalid token. Please log in again.',
  };
};

// ─── Global Error Handler ───────────────────────────────────────
export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';

  // AppError (operational errors we throw intentionally)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Zod validation errors
  else if (err instanceof ZodError) {
    const zodErr = handleZodError(err);
    statusCode = zodErr.statusCode;
    message = zodErr.message;
  }
  // Prisma errors
  else if (isPrismaError(err)) {
    const prismaErr = handlePrismaError(err);
    statusCode = prismaErr.statusCode;
    message = prismaErr.message;
  }
  // JWT errors
  else if (isJwtError(err)) {
    const jwtErr = handleJwtError(err as Error);
    statusCode = jwtErr.statusCode;
    message = jwtErr.message;
  }
  // Generic Error objects
  else if (err instanceof Error) {
    message = err.message;
  }

  // Log the error
  logger.error(message, {
    statusCode,
    path: _req.originalUrl,
    method: _req.method,
    ...(err instanceof Error && { stack: err.stack }),
  });

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' &&
      err instanceof Error && { stack: err.stack }),
  });
};
