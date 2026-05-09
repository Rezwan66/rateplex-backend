import status from 'http-status';
import { prisma } from '../../config/prisma.js';
import AppError from '../../utils/AppError.js';

// ─── Toggle like on a review ────────────────────────────────────
const toggleLike = async (userId: string, reviewId: string) => {
  // Verify review exists
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new AppError(status.NOT_FOUND, 'Review not found.');
  }

  // Check existing like
  const existingLike = await prisma.like.findUnique({
    where: { userId_reviewId: { userId, reviewId } },
  });

  if (existingLike) {
    // Unlike
    await prisma.like.delete({ where: { id: existingLike.id } });
    return { liked: false };
  } else {
    // Like
    await prisma.like.create({
      data: { userId, reviewId },
    });
    return { liked: true };
  }
};

// ─── Add comment to a review ────────────────────────────────────
const addComment = async (
  userId: string,
  input: { reviewId: string; content: string; isSpoiler?: boolean; parentId?: string },
) => {
  // Verify review exists
  const review = await prisma.review.findUnique({ where: { id: input.reviewId } });
  if (!review) {
    throw new AppError(status.NOT_FOUND, 'Review not found.');
  }

  // If replying, verify parent comment exists
  if (input.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: input.parentId } });
    if (!parent) {
      throw new AppError(status.NOT_FOUND, 'Parent comment not found.');
    }
  }

  const comment = await prisma.comment.create({
    data: {
      userId,
      reviewId: input.reviewId,
      content: input.content,
      isSpoiler: input.isSpoiler ?? false,
      parentId: input.parentId,
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  return comment;
};

// ─── Delete comment (own) ───────────────────────────────────────
const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });

  if (!comment) {
    throw new AppError(status.NOT_FOUND, 'Comment not found.');
  }

  if (comment.userId !== userId) {
    throw new AppError(status.FORBIDDEN, 'You can only delete your own comments.');
  }

  await prisma.comment.delete({ where: { id: commentId } });
};

export const InteractionService = {
  toggleLike,
  addComment,
  deleteComment,
};
