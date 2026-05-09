import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string({ error: 'DATABASE_URL is required' }),

  // JWT
  JWT_ACCESS_SECRET: z.string({ error: 'JWT_ACCESS_SECRET is required' }),
  JWT_REFRESH_SECRET: z.string({ error: 'JWT_REFRESH_SECRET is required' }),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),

  // AI
  ANTHROPIC_API_KEY: z.string().default(''),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const envVars = parsed.data;
