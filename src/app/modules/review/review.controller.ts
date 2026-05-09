import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ReviewService } from './review.service.js';
import { ReviewStatus } from '../../../generated/prisma/client.js';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const review = await ReviewService.createReview(userId, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Review submitted successfully. It will be visible after approval.',
    data: review,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const review = await ReviewService.updateReview(String(req.params.id), userId, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Review updated successfully.',
    data: review,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  await ReviewService.deleteReview(String(req.params.id), userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Review deleted successfully.',
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const query = {
    status: req.query.status as string | undefined,
    mediaId: req.query.mediaId as string | undefined,
    userId: req.query.userId as string | undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
  };

  const result = await ReviewService.getAllReviews(query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Reviews retrieved successfully.',
    data: result.data,
    meta: result.meta,
  });
});

const updateReviewStatus = catchAsync(async (req: Request, res: Response) => {
  const { status: newStatus } = req.body as { status: ReviewStatus };
  const review = await ReviewService.updateReviewStatus(String(req.params.id), newStatus);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: `Review ${newStatus.toLowerCase()} successfully.`,
    data: review,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await ReviewService.getMyReviews(userId, page, limit);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Your reviews retrieved successfully.',
    data: result.data,
    meta: result.meta,
  });
});

export const ReviewController = {
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
  updateReviewStatus,
  getMyReviews,
};
