import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AIService } from './ai.service.js';

const getRecommendations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await AIService.getRecommendations(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'AI recommendations generated successfully.',
    data: result,
  });
});

const chat = catchAsync(async (req: Request, res: Response) => {
  const { message, history = [] } = req.body as {
    message: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  const result = await AIService.chat(message, history);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'AI response generated successfully.',
    data: result,
  });
});

const analyzeTaste = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await AIService.analyzeTaste(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Taste analysis generated successfully.',
    data: result,
  });
});

const reviewSentiment = catchAsync(async (req: Request, res: Response) => {
  const { mediaId } = req.body as { mediaId: string };
  const result = await AIService.reviewSentiment(mediaId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Sentiment analysis generated successfully.',
    data: result,
  });
});

const autoTag = catchAsync(async (req: Request, res: Response) => {
  const result = await AIService.autoTag(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Auto-tag generated successfully.',
    data: result,
  });
});

export const AIController = {
  getRecommendations,
  chat,
  analyzeTaste,
  reviewSentiment,
  autoTag,
};
