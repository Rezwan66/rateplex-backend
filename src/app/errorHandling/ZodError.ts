/* eslint-disable @typescript-eslint/no-explicit-any */
import status from 'http-status';
import { ZodError } from 'zod';

export const isZodError = (error: any) => error instanceof ZodError;

export const handleZodError = (error: ZodError) => {
  const errorSources = [];

  error.issues.forEach(issue => {
    errorSources.push({
      path: issue.path.join(' => '),
      message: issue.message,
    });
  });
  return {
    statusCode: status.BAD_REQUEST,
    message: 'ZOD Validation Error',
    errorSources,
  };
};
