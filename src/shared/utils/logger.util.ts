import { isDevelopment, ENV } from '@/shared/constants';
import pino, { Logger } from 'pino';

/**
 * Application-wide Pino logger.
 * Use child loggers via `createChildLogger` for module-scoped context.
 */
export const logger: Logger = pino({
  level: ENV.LOG_LEVEL,
  transport: isDevelopment()
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

/**
 * Creates a child logger with a module name for structured log filtering.
 */
export const createChildLogger = (moduleName: string): Logger =>
  logger.child({ module: moduleName });
