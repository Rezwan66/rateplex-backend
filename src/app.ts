import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { IndexRoutes } from './app/routes/index.js';
import { globalErrorHandler } from './app/middleware/globalErrorHandler.js';
import { generalLimiter } from './app/middleware/rateLimiter.js';
import { envVars } from './app/config/env.js';
import logger from './app/utils/logger.js';

const app: Application = express();

// ─── CORS ───────────────────────────────────────────────────────
app.use(
  cors({
    origin: [envVars.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Body Parsers ───────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ─── Rate Limiter ───────────────────────────────────────────────
const apiPrefix = envVars.NODE_ENV === 'production' ? '/' : '/api/v1';
app.use(apiPrefix, generalLimiter);

// ─── Request Logger ─────────────────────────────────────────────
app.use((req: Request, _res: Response, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl}`, {
      status: _res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// ─── Health Check ───────────────────────────────────────────────
const healthPath = envVars.NODE_ENV === 'production' ? '/health' : '/';
app.get(healthPath, (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RatePlex API</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #141414; color: #fff; }
            .container { max-width: 600px; margin: 50px auto; background: #1f1f1f; padding: 30px; border-radius: 12px; border: 1px solid #333; }
            h1 { color: #E50914; margin-bottom: 10px; }
            .info { margin: 15px 0; padding: 10px; background: #2a2a2a; border-left: 4px solid #E50914; border-radius: 4px; }
            .label { font-weight: bold; color: #B3B3B3; }
            .value { color: #fff; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎬 RatePlex API</h1>
            <div class="info">
                <span class="label">Version:</span> <span class="value">1.0.0</span>
            </div>
            <div class="info">
                <span class="label">Status:</span> <span class="value">Server is running</span>
            </div>
            <div class="info">
                <span class="label">Environment:</span> <span class="value">${envVars.NODE_ENV}</span>
            </div>
            <div class="info">
                <span class="label">Timestamp:</span> <span class="value">${new Date().toISOString()}</span>
            </div>
        </div>
    </body>
    </html>
  `);
});

// ─── API Routes ─────────────────────────────────────────────────
app.use(apiPrefix, IndexRoutes);

// ─── Global Error Handler ───────────────────────────────────────
app.use(globalErrorHandler);

export default app;
