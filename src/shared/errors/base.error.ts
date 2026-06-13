import { HTTP_STATUS, HttpStatusCode } from '@/shared/constants';

/**
 * Base application error with HTTP status code and optional details.
 */
export class BaseError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Thrown when request input fails validation or business preconditions. */
export class BadRequestError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.BAD_REQUEST, details);
  }
}

/** Thrown when a resource cannot be found. */
export class NotFoundError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.NOT_FOUND, details);
  }
}

/** Thrown when authentication is missing or invalid. */
export class UnauthorizedError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.UNAUTHORIZED, details);
  }
}

/** Thrown when the caller lacks permission for an action. */
export class ForbiddenError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.FORBIDDEN, details);
  }
}

/** Thrown when a resource conflict prevents the operation. */
export class ConflictError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.CONFLICT, details);
  }
}

/** Thrown when domain rules reject otherwise valid input. */
export class UnprocessableEntityError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, details);
  }
}

/** Thrown for unexpected internal failures. */
export class InternalServerError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, details);
  }
}
