import status from 'http-status';
import { prisma } from '../../config/prisma.js';
import AppError from '../../utils/AppError.js';
import { ReviewStatus } from '../../../generated/prisma/client.js';

const reviewInclude = {
  user: {
    select: { id: true, name: true, avatar: true },
  },
  media: {
    select: { id: true, title: true, posterUrl: true, type: true },
  },
  _count: {
    select: { likes: true, comments: true },
  },
} as const;

// ─── Recalculate media rating ───────────────────────────────────
const recalculateMediaRating = async (mediaId: string) => {
  const result = await prisma.review.aggregate({
    where: { mediaId, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.media.update({
    where: { id: mediaId },
    data: {
      averageRating: result._avg.rating || 0,
      reviewCount: result._count.id,
    },
  });
};

// ─── Create review ──────────────────────────────────────────────
const createReview = async (
  userId: string,
  input: { mediaId: string; rating: number; content?: string; isSpoiler?: boolean },
) => {
  // Check if media exists
  const media = await prisma.media.findUnique({ where: { id: input.mediaId } });
  if (!media) {
    throw new AppError(status.NOT_FOUND, 'Media not found.');
  }

  // Check for existing review by same user on same media
  const existingReview = await prisma.review.findFirst({
    where: { userId, mediaId: input.mediaId },
  });

  if (existingReview) {
    throw new AppError(status.CONFLICT, 'You have already reviewed this media.');
  }

  const review = await prisma.review.create({
    data: {
      userId,
      mediaId: input.mediaId,
      rating: input.rating,
      content: input.content,
      isSpoiler: input.isSpoiler ?? false,
    },
    include: reviewInclude,
  });

  return review;
};

// ─── Update review (own) ────────────────────────────────────────
const updateReview = async (
  reviewId: string,
  userId: string,
  input: { rating?: number; content?: string; isSpoiler?: boolean },
) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review) {
    throw new AppError(status.NOT_FOUND, 'Review not found.');
  }

  if (review.userId !== userId) {
    throw new AppError(status.FORBIDDEN, 'You can only update your own reviews.');
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: input,
    include: reviewInclude,
  });

  // Recalculate if rating changed
  if (input.rating !== undefined) {
    await recalculateMediaRating(review.mediaId);
  }

  return updated;
};

// ─── Delete review (own) ────────────────────────────────────────
const deleteReview = async (reviewId: string, userId: string) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review) {
    throw new AppError(status.NOT_FOUND, 'Review not found.');
  }

  if (review.userId !== userId) {
    throw new AppError(status.FORBIDDEN, 'You can only delete your own reviews.');
  }

  await prisma.review.delete({ where: { id: reviewId } });
  await recalculateMediaRating(review.mediaId);
};

// ─── Get all reviews (Admin) ────────────────────────────────────
const getAllReviews = async (query: {
  status?: string;
  mediaId?: string;
  userId?: string;
  page: number;
  limit: number;
}) => {
  const where: Record<string, unknown> = {};
  if (query.status) where.status = query.status;
  if (query.mediaId) where.mediaId = query.mediaId;
  if (query.userId) where.userId = query.userId;

  const skip = (query.page - 1) * query.limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: reviews,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

// ─── Update review status (Admin) ───────────────────────────────
const updateReviewStatus = async (reviewId: string, newStatus: ReviewStatus) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!review) {
    throw new AppError(status.NOT_FOUND, 'Review not found.');
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { status: newStatus },
    include: reviewInclude,
  });

  // Recalculate when status changes (approval/rejection affects avg)
  await recalculateMediaRating(review.mediaId);

  return updated;
};

// ─── Get my reviews ─────────────────────────────────────────────
const getMyReviews = async (userId: string, page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      include: {
        ...reviewInclude,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { userId } }),
  ]);

  return {
    data: reviews,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const ReviewService = {
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
  updateReviewStatus,
  getMyReviews,
};
