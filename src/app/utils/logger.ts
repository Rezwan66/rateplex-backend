import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json(),
  ),
  defaultMeta: { service: 'rateplex-api' },
  transports: [
    // Console-only in all environments (Vercel has no writable filesystem)
    new transports.Console({
      format:
        process.env.NODE_ENV !== 'production'
          ? format.combine(
              format.colorize(),
              format.printf(({ level, message, timestamp, ...meta }) => {
                const metaStr =
                  Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp as string} [${level}]: ${message as string}${metaStr}`;
              }),
            )
          : format.combine(format.timestamp(), format.json()),
    }),
  ],
});

export default logger;
