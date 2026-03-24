/* eslint-disable @typescript-eslint/no-explicit-any */
import status from 'http-status';
import { ZodError } from 'zod';

export const isZodError = (error: any) => error instanceof ZodError;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handleZodError = (error: ZodError) => {
  //   const errorSources = [];

  //   error.issues.forEach(issue => {
  //     errorSources.push({
  //       path: issue.path.join(' => '),
  //       message: issue.message,
  //     });
  //   });
  return {
    statusCode: status.BAD_REQUEST,
    message: error.issues[0].message,
    // errorSources,
  };
};
