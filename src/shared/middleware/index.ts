import pinoHttp from 'pino-http';

import { logger } from '@/shared/utils';

/** HTTP request logging middleware backed by Pino. */
export const requestLoggerMiddleware = pinoHttp({
  logger,
  autoLogging: {
    ignore: (request) => request.url === '/health',
  },
});

export {
  errorHandlerMiddleware,
  notFoundHandlerMiddleware,
} from './error-handler.middleware';
export { validateRequestMiddleware } from './validation.middleware';
