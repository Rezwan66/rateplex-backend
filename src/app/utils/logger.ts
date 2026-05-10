/* eslint-disable @typescript-eslint/no-explicit-any */
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, errors, json, colorize, printf } = format;

// Explicit types for the formatter to prevent 'any' errors on Vercel

const devFormat = printf(({ level, message, timestamp, ...meta }: Record<string, any>) => {
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json()),
  defaultMeta: { service: 'rateplex-api' },
  transports: [
    new transports.Console({
      format:
        process.env.NODE_ENV !== 'production'
          ? combine(colorize(), devFormat)
          : combine(timestamp(), json()),
    } as any), // 'as any' bypasses strict Winston transport type mismatches
  ],
});

export default logger;
