import { z } from 'zod';

export const createMediaSchema = z.object({
  title: z.string({ error: 'Title is required' }).min(1).max(255),
  description: z.string().optional(),
  releaseYear: z.coerce.number().int().min(1888).max(2030).optional(),
  director: z.string().max(255).optional(),
  cast: z.array(z.string()).default([]),
  platform: z.array(z.string()).default([]),
  priceType: z.enum(['FREE', 'PREMIUM']),
  streamingLink: z.string().url().optional().or(z.literal('')),
  type: z.enum(['MOVIE', 'SERIES', 'ANIME']).default('MOVIE'),
  status: z.enum(['RELEASED', 'ONGOING', 'UPCOMING', 'CANCELLED']).default('RELEASED'),
  posterUrl: z.string().url().optional().or(z.literal('')),
  trailerUrl: z.string().url().optional().or(z.literal('')),
  duration: z.coerce.number().int().positive().optional(),
  episodes: z.coerce.number().int().positive().optional(),
  seasons: z.coerce.number().int().positive().optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(100).optional(),
  genreIds: z.array(z.string().uuid()).default([]),
});

export const updateMediaSchema = createMediaSchema.partial();

export const mediaQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['MOVIE', 'SERIES', 'ANIME']).optional(),
  genre: z.string().optional(),
  year: z.coerce.number().int().optional(),
  rating: z.coerce.number().min(0).max(10).optional(),
  priceType: z.enum(['FREE', 'PREMIUM']).optional(),
  sort: z.enum(['rating', 'year', 'title', 'reviewCount']).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
