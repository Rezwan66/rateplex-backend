import status from 'http-status';
import { prisma } from '../../config/prisma.js';
import AppError from '../../utils/AppError.js';
import { z } from 'zod';
import { createMediaSchema, mediaQuerySchema } from './media.validation.js';

type CreateMediaInput = z.infer<typeof createMediaSchema>;
type MediaQuery = z.infer<typeof mediaQuerySchema>;

// ─── Include for media queries ──────────────────────────────────
const mediaInclude = {
  genres: {
    include: {
      genre: true,
    },
  },
} as const;

// ─── List media with filters ────────────────────────────────────
const getAllMedia = async (query: MediaQuery) => {
  const { search, type, genre, year, rating, priceType, sort, order, page, limit } = query;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { director: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (type) where.type = type;
  if (year) where.releaseYear = year;
  if (priceType) where.priceType = priceType;
  if (rating) where.averageRating = { gte: rating };

  if (genre) {
    where.genres = {
      some: {
        genre: { name: { equals: genre, mode: 'insensitive' } },
      },
    };
  }

  // Sort mapping
  const orderBy: Record<string, string> = {};
  if (sort === 'rating') orderBy.averageRating = order;
  else if (sort === 'year') orderBy.releaseYear = order;
  else if (sort === 'title') orderBy.title = order;
  else if (sort === 'reviewCount') orderBy.reviewCount = order;
  else orderBy.createdAt = 'desc';

  const skip = (page - 1) * limit;

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where,
      include: mediaInclude,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.media.count({ where }),
  ]);

  return {
    data: media,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Get single media ───────────────────────────────────────────
const getMediaById = async (id: string) => {
  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      ...mediaInclude,
      reviews: {
        where: { status: 'APPROVED' },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: { reviews: true, watchlist: true },
      },
    },
  });

  if (!media) {
    throw new AppError(status.NOT_FOUND, 'Media not found.');
  }

  return media;
};

// ─── Get reviews for media ──────────────────────────────────────
const getMediaReviews = async (mediaId: string, page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { mediaId, status: 'APPROVED' },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { mediaId, status: 'APPROVED' } }),
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

// ─── Create media (Admin) ───────────────────────────────────────
const createMedia = async (input: CreateMediaInput) => {
  const { genreIds, posterUrl, trailerUrl, ...mediaData } = input;

  const media = await prisma.media.create({
    data: {
      ...mediaData,
      posterUrl: posterUrl || null,
      trailerUrl: trailerUrl || null,
      ...(genreIds.length > 0 && {
        genres: {
          create: genreIds.map((genreId) => ({
            genreId,
          })),
        },
      }),
    },
    include: mediaInclude,
  });

  return media;
};

// ─── Update media (Admin) ───────────────────────────────────────
const updateMedia = async (id: string, input: Partial<CreateMediaInput>) => {
  const existing = await prisma.media.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(status.NOT_FOUND, 'Media not found.');
  }

  const { genreIds, posterUrl, trailerUrl, ...mediaData } = input;

  // If genreIds provided, replace all genre associations
  if (genreIds !== undefined) {
    await prisma.mediaGenre.deleteMany({ where: { mediaId: id } });
    if (genreIds.length > 0) {
      await prisma.mediaGenre.createMany({
        data: genreIds.map((genreId) => ({
          mediaId: id,
          genreId,
        })),
      });
    }
  }

  const media = await prisma.media.update({
    where: { id },
    data: {
      ...mediaData,
      ...(posterUrl !== undefined && { posterUrl: posterUrl || null }),
      ...(trailerUrl !== undefined && { trailerUrl: trailerUrl || null }),
    },
    include: mediaInclude,
  });

  return media;
};

// ─── Delete media (Admin) ───────────────────────────────────────
const deleteMedia = async (id: string) => {
  const existing = await prisma.media.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(status.NOT_FOUND, 'Media not found.');
  }

  await prisma.media.delete({ where: { id } });
};

// ─── Featured media ─────────────────────────────────────────────
const getFeaturedMedia = async () => {
  const [topRated, mostReviewed] = await Promise.all([
    prisma.media.findMany({
      where: { reviewCount: { gt: 0 } },
      include: mediaInclude,
      orderBy: { averageRating: 'desc' },
      take: 10,
    }),
    prisma.media.findMany({
      where: { reviewCount: { gt: 0 } },
      include: mediaInclude,
      orderBy: { reviewCount: 'desc' },
      take: 10,
    }),
  ]);

  return { topRated, mostReviewed };
};

// ─── Media stats (Admin) ────────────────────────────────────────
const getMediaStats = async () => {
  const [totalMedia, byType, byPriceType] = await Promise.all([
    prisma.media.count(),
    prisma.media.groupBy({
      by: ['type'],
      _count: { id: true },
    }),
    prisma.media.groupBy({
      by: ['priceType'],
      _count: { id: true },
    }),
  ]);

  return { totalMedia, byType, byPriceType };
};

export const MediaService = {
  getAllMedia,
  getMediaById,
  getMediaReviews,
  createMedia,
  updateMedia,
  deleteMedia,
  getFeaturedMedia,
  getMediaStats,
};
