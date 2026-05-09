import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const validateRequest = (zodSchema: z.ZodObject) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsedResult = zodSchema.safeParse(req.body);

    if (!parsedResult.success) {
      next(parsedResult.error);
      return;
    }

    req.body = parsedResult.data;
    next();
  };
};
