import status from 'http-status';
import { prisma } from '../../config/prisma.js';
import AppError from '../../utils/AppError.js';
import { WatchStatus } from '../../../generated/prisma/client.js';

const watchlistInclude = {
  media: {
    select: {
      id: true,
      title: true,
      posterUrl: true,
      type: true,
      averageRating: true,
      releaseYear: true,
    },
  },
} as const;

// ─── Get watchlist ──────────────────────────────────────────────
const getWatchlist = async (
  userId: string,
  query: { status?: string; page: number; limit: number },
) => {
  const where: Record<string, unknown> = { userId };
  if (query.status) where.status = query.status;

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    prisma.watchlist.findMany({
      where,
      include: watchlistInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit,
    }),
    prisma.watchlist.count({ where }),
  ]);

  return {
    data: items,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

// ─── Add to watchlist ───────────────────────────────────────────
const addToWatchlist = async (
  userId: string,
  input: { mediaId: string; status?: WatchStatus },
) => {
  // Check media exists
  const media = await prisma.media.findUnique({ where: { id: input.mediaId } });
  if (!media) {
    throw new AppError(status.NOT_FOUND, 'Media not found.');
  }

  // Check if already in watchlist
  const existing = await prisma.watchlist.findUnique({
    where: { userId_mediaId: { userId, mediaId: input.mediaId } },
  });

  if (existing) {
    throw new AppError(status.CONFLICT, 'Media is already in your watchlist.');
  }

  const item = await prisma.watchlist.create({
    data: {
      userId,
      mediaId: input.mediaId,
      status: input.status || 'PLAN_TO_WATCH',
    },
    include: watchlistInclude,
  });

  return item;
};

// ─── Update watchlist status ────────────────────────────────────
const updateWatchlistStatus = async (
  id: string,
  userId: string,
  newStatus: WatchStatus,
) => {
  const item = await prisma.watchlist.findUnique({ where: { id } });

  if (!item) {
    throw new AppError(status.NOT_FOUND, 'Watchlist entry not found.');
  }

  if (item.userId !== userId) {
    throw new AppError(status.FORBIDDEN, 'You can only update your own watchlist.');
  }

  const updated = await prisma.watchlist.update({
    where: { id },
    data: { status: newStatus },
    include: watchlistInclude,
  });

  return updated;
};

// ─── Remove from watchlist ──────────────────────────────────────
const removeFromWatchlist = async (id: string, userId: string) => {
  const item = await prisma.watchlist.findUnique({ where: { id } });

  if (!item) {
    throw new AppError(status.NOT_FOUND, 'Watchlist entry not found.');
  }

  if (item.userId !== userId) {
    throw new AppError(status.FORBIDDEN, 'You can only remove from your own watchlist.');
  }

  await prisma.watchlist.delete({ where: { id } });
};

export const WatchlistService = {
  getWatchlist,
  addToWatchlist,
  updateWatchlistStatus,
  removeFromWatchlist,
};
