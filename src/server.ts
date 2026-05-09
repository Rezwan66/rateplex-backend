import app from './app';
import { envVars } from './app/config/env';
import logger from './app/utils/logger';

const bootstrap = async () => {
  try {
    app.listen(envVars.PORT, () => {
      logger.info(`🚀 Server is running on http://localhost:${envVars.PORT}`);
      logger.info(`📡 Environment: ${envVars.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ─── Unhandled Rejection Handler ────────────────────────────────
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', { reason });
  process.exit(1);
});

// ─── Uncaught Exception Handler ─────────────────────────────────
process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

bootstrap();
