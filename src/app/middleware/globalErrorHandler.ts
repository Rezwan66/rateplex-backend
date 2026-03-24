import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import {
  AppError,
  handlePrismaError,
  handleZodError,
  isPrismaError,
  isZodError,
} from '../errorHandling';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (isZodError(err)) {
    const zodErr = handleZodError(err);
    statusCode = zodErr.statusCode;
    message = zodErr.message;
  } else if (isPrismaError(err)) {
    const prismaErr = handlePrismaError(err);
    statusCode = prismaErr.statusCode;
    message = prismaErr.message;
  } else if (err && typeof err === 'object' && typeof err.message === 'string') {
    message = err.message;
  }

  console.error('[globalErrorHandler]', { statusCode, message, original: err });

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
};
