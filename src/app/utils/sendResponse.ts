import { Response } from 'express';

interface IMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ISendResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: IMeta;
}

export const sendResponse = <T>(res: Response, payload: ISendResponse<T>) => {
  const { statusCode, success, message, data, meta } = payload;

  res.status(statusCode).json({
    success,
    statusCode,
    message,
    data,
    ...(meta && { meta }),
  });
};
