import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { MediaService } from './media.service.js';
import { mediaQuerySchema } from './media.validation.js';

const getAllMedia = catchAsync(async (req: Request, res: Response) => {
  const query = mediaQuerySchema.parse(req.query);
  const result = await MediaService.getAllMedia(query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Media retrieved successfully.',
    data: result.data,
    meta: result.meta,
  });
});

const getMediaById = catchAsync(async (req: Request, res: Response) => {
  const media = await MediaService.getMediaById(String(req.params.id));

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Media retrieved successfully.',
    data: media,
  });
});

const getMediaReviews = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await MediaService.getMediaReviews(String(req.params.id), page, limit);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Reviews retrieved successfully.',
    data: result.data,
    meta: result.meta,
  });
});

const createMedia = catchAsync(async (req: Request, res: Response) => {
  const media = await MediaService.createMedia(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Media created successfully.',
    data: media,
  });
});

const updateMedia = catchAsync(async (req: Request, res: Response) => {
  const media = await MediaService.updateMedia(String(req.params.id), req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Media updated successfully.',
    data: media,
  });
});

const deleteMedia = catchAsync(async (req: Request, res: Response) => {
  await MediaService.deleteMedia(String(req.params.id));

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Media deleted successfully.',
  });
});

const getFeaturedMedia = catchAsync(async (_req: Request, res: Response) => {
  const featured = await MediaService.getFeaturedMedia();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Featured media retrieved successfully.',
    data: featured,
  });
});

const getMediaStats = catchAsync(async (_req: Request, res: Response) => {
  const stats = await MediaService.getMediaStats();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Media stats retrieved successfully.',
    data: stats,
  });
});

export const MediaController = {
  getAllMedia,
  getMediaById,
  getMediaReviews,
  createMedia,
  updateMedia,
  deleteMedia,
  getFeaturedMedia,
  getMediaStats,
};
