import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .string({ error: 'Email is required' })
    .email('Please provide a valid email address'),
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .email('Please provide a valid email address'),
  password: z.string({ error: 'Password is required' }),
});

export const googleAuthSchema = z.object({
  googleId: z.string({ error: 'Google ID is required' }),
  email: z
    .string({ error: 'Email is required' })
    .email('Please provide a valid email address'),
  name: z.string({ error: 'Name is required' }),
  avatar: z.string().optional(),
});
