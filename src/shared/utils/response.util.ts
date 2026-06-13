import { Response } from 'express';

import { HTTP_STATUS } from '@/shared/constants';

/** Shape of a successful API response payload. */
export interface ISuccessResponseOutput<T> {
  success: true;
  data: T;
  message?: string;
}

/** Shape of a failed API response payload. */
export interface IErrorResponseOutput {
  success: false;
  message: string;
  details?: unknown;
}

/**
 * Utility facade for consistent HTTP JSON responses.
 */
export class ResponseUtil {
  /**
   * Sends a successful JSON response with optional message.
   */
  static success<T>(
    response: Response,
    data: T,
    message?: string,
    statusCode: number = HTTP_STATUS.OK,
  ): void {
    const payload: ISuccessResponseOutput<T> = {
      success: true,
      data,
      ...(message ? { message } : {}),
    };
    response.status(statusCode).json(payload);
  }

  /**
   * Sends an error JSON response with optional details.
   */
  static error(
    response: Response,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: unknown,
  ): void {
    const payload: IErrorResponseOutput = {
      success: false,
      message,
      ...(details !== undefined ? { details } : {}),
    };
    response.status(statusCode).json(payload);
  }

  /**
   * Sends a 404 not found response.
   */
  static notFound(response: Response, message: string): void {
    ResponseUtil.error(response, message, HTTP_STATUS.NOT_FOUND);
  }
}
