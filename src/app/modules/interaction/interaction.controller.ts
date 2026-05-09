import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { InteractionService } from './interaction.service.js';

const toggleLike = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await InteractionService.toggleLike(userId, String(req.params.reviewId));

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: result.liked ? 'Review liked.' : 'Review unliked.',
    data: result,
  });
});

const addComment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const comment = await InteractionService.addComment(userId, req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Comment added successfully.',
    data: comment,
  });
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  await InteractionService.deleteComment(String(req.params.id), userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Comment deleted successfully.',
  });
});

export const InteractionController = {
  toggleLike,
  addComment,
  deleteComment,
};
