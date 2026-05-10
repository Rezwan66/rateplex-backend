import { createLogger, format, transports } from 'winston';

const { combine, timestamp, errors, json, colorize, printf } = format;

const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json(),
  ),
  defaultMeta: { service: 'rateplex-api' },
  transports: [
    new transports.Console({
      format:
        process.env.NODE_ENV !== 'production'
          ? combine(colorize(), devFormat)
          : combine(timestamp(), json()),
    }),
  ],
});

export default logger;
