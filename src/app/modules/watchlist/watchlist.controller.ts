import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { WatchlistService } from './watchlist.service.js';
import { WatchStatus } from '../../../generated/prisma/client.js';

const getWatchlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const query = {
    status: req.query.status as string | undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
  };

  const result = await WatchlistService.getWatchlist(userId, query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Watchlist retrieved successfully.',
    data: result.data,
    meta: result.meta,
  });
});

const addToWatchlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const item = await WatchlistService.addToWatchlist(userId, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Added to watchlist successfully.',
    data: item,
  });
});

const updateWatchlistStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { status: newStatus } = req.body as { status: WatchStatus };
  const item = await WatchlistService.updateWatchlistStatus(String(req.params.id), userId, newStatus);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Watchlist status updated successfully.',
    data: item,
  });
});

const removeFromWatchlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  await WatchlistService.removeFromWatchlist(String(req.params.id), userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Removed from watchlist successfully.',
  });
});

export const WatchlistController = {
  getWatchlist,
  addToWatchlist,
  updateWatchlistStatus,
  removeFromWatchlist,
};
