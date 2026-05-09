import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { DashboardService } from './dashboard.service.js';

const getAdminStats = catchAsync(async (_req: Request, res: Response) => {
  const stats = await DashboardService.getAdminStats();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Admin stats retrieved successfully.',
    data: stats,
  });
});

const getRecentActivity = catchAsync(async (_req: Request, res: Response) => {
  const activity = await DashboardService.getRecentActivity();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Recent activity retrieved successfully.',
    data: activity,
  });
});

const getMediaByType = catchAsync(async (_req: Request, res: Response) => {
  const data = await DashboardService.getMediaByType();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Media by type retrieved successfully.',
    data,
  });
});

const getReviewsOverTime = catchAsync(async (_req: Request, res: Response) => {
  const data = await DashboardService.getReviewsOverTime();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Reviews over time retrieved successfully.',
    data,
  });
});

const getTopRated = catchAsync(async (_req: Request, res: Response) => {
  const data = await DashboardService.getTopRated();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Top rated media retrieved successfully.',
    data,
  });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const stats = await DashboardService.getUserStats(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'User stats retrieved successfully.',
    data: stats,
  });
});

export const DashboardController = {
  getAdminStats,
  getRecentActivity,
  getMediaByType,
  getReviewsOverTime,
  getTopRated,
  getUserStats,
};
