import { z } from 'zod';

export const createReviewSchema = z.object({
  mediaId: z.string({ error: 'Media ID is required' }).uuid(),
  rating: z.coerce
    .number({ error: 'Rating is required' })
    .int()
    .min(1, 'Rating must be at least 1')
    .max(10, 'Rating must be at most 10'),
  content: z.string().max(5000).optional(),
  isSpoiler: z.boolean().default(false),
});

export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(10).optional(),
  content: z.string().max(5000).optional(),
  isSpoiler: z.boolean().optional(),
});

export const reviewStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
