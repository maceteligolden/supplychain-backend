import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { BaseError, InternalServerError } from '@/shared/errors';
import { HTTP_STATUS, isDevelopment } from '@/shared/constants';
import { logger, ResponseUtil } from '@/shared/utils';

/**
 * Global Express error handler middleware.
 * Converts known errors to structured JSON responses.
 */
export const errorHandlerMiddleware = (
  error: Error,
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  if (response.headersSent) {
    next(error);
    return;
  }

  logger.error(
    {
      err: error,
      path: request.path,
      method: request.method,
    },
    'Request failed',
  );

  if (error instanceof BaseError) {
    const details =
      isDevelopment() && error.details !== undefined ? error.details : undefined;
    ResponseUtil.error(response, error.message, error.statusCode, details);
    return;
  }

  if (error instanceof ZodError) {
    const validationDetails = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    ResponseUtil.error(
      response,
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      validationDetails,
    );
    return;
  }

  const fallbackMessage =
    error instanceof Error ? error.message : 'Internal Server Error';
  const details =
    isDevelopment() && error instanceof Error && error.stack
      ? { stack: error.stack }
      : undefined;

  ResponseUtil.error(
    response,
    fallbackMessage || new InternalServerError('Internal Server Error').message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details,
  );
};

/**
 * 404 handler for unmatched routes.
 */
export const notFoundHandlerMiddleware = (
  request: Request,
  response: Response,
): void => {
  logger.warn({ method: request.method, path: request.path }, 'Route not found');
  ResponseUtil.notFound(response, `Route ${request.method} ${request.path} not found`);
};
