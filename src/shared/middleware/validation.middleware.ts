import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

import { HTTP_STATUS } from '@/shared/constants';
import { logger, ResponseUtil } from '@/shared/utils';

type ValidationTarget = 'body' | 'query' | 'params';

const buildValidationInput = (
  request: Request,
  target: ValidationTarget,
): Record<ValidationTarget, unknown> => {
  switch (target) {
    case 'body':
      return { body: request.body as unknown, query: undefined, params: undefined };
    case 'query':
      return { body: undefined, query: request.query, params: undefined };
    case 'params':
      return { body: undefined, query: undefined, params: request.params };
  }
};

const assignValidatedSegment = (
  request: Request,
  target: ValidationTarget,
  validatedSegment: unknown,
): void => {
  switch (target) {
    case 'body':
      request.body = validatedSegment;
      return;
    case 'query':
      request.query = validatedSegment as Request['query'];
      return;
    case 'params':
      request.params = validatedSegment as Request['params'];
      return;
  }
};

/**
 * Factory that validates a request segment against a Zod schema at the route layer.
 */
export const validateRequestMiddleware = <TSchema extends ZodTypeAny>(
  schema: TSchema,
  target: ValidationTarget = 'body',
) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    try {
      const validationResult = schema.safeParse(buildValidationInput(request, target));

      if (!validationResult.success) {
        const validationDetails = validationResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        logger.warn(
          {
            path: request.path,
            method: request.method,
            validationDetails,
          },
          'Request validation failed',
        );

        ResponseUtil.error(
          response,
          'Validation failed',
          HTTP_STATUS.BAD_REQUEST,
          validationDetails,
        );
        return;
      }

      const validatedPayload = validationResult.data as Partial<
        Record<ValidationTarget, unknown>
      >;
      assignValidatedSegment(request, target, validatedPayload[target]);
      next();
    } catch (error) {
      logger.error({ err: error }, 'Unexpected validation failure');
      ResponseUtil.error(
        response,
        'An error occurred during validation',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  };
};
