import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { IndexRoutes } from './app/routes';
import { globalErrorHandler } from './app/middleware/globalErrorHandler';
import { envVars } from './app/config/env';

const app: Application = express();

app.use(
  cors({
    origin: [envVars.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RatePlex API</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                .container { max-width: 600px; margin: 50px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #333; margin-bottom: 10px; }
                .info { margin: 15px 0; padding: 10px; background: #fff0f4; border-left: 4px solid #ff0059; }
                .label { font-weight: bold; color: #555; }
                .value { color: #333; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Welcome to RatePlex API</h1>
                <div class="info">
                    <span class="label">Version:</span> <span class="value">1.0.0</span>
                </div>
                <div class="info">
                    <span class="label">Status:</span> <span class="value">Server is running...</span>
                </div>
                <div class="info">
                    <span class="label">Timestamp:</span> <span class="value">${new Date().toISOString()}</span>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Main API route
app.use('/api/v1', IndexRoutes);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
