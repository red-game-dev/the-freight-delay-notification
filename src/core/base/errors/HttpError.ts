/**
 * HTTP Error Classes
 * HTTP-specific errors that extend BaseError system
 * Provides consistent error handling across API routes
 */

import { isDevelopment } from "../utils/environment";
import {
  BaseError,
  InfrastructureError,
  NotFoundError,
  ValidationError,
} from "./BaseError";

/**
 * Base HTTP Error with status code
 */
export class HttpError extends InfrastructureError {
  constructor(
    message: string,
    public readonly statusCode: number,
    context?: Record<string, unknown>,
  ) {
    super(message, { ...context, statusCode });
  }

  toHttpResponse() {
    return {
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(isDevelopment() && {
        context: this.context,
        stack: this.stack,
      }),
    };
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends HttpError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 400, context);
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends HttpError {
  constructor(
    message: string = "Unauthorized",
    context?: Record<string, unknown>,
  ) {
    super(message, 401, context);
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends HttpError {
  constructor(
    message: string = "Forbidden",
    context?: Record<string, unknown>,
  ) {
    super(message, 403, context);
  }
}

/**
 * 404 Not Found
 */
export class NotFoundHttpError extends HttpError {
  constructor(
    message: string = "Resource not found",
    context?: Record<string, unknown>,
  ) {
    super(message, 404, context);
  }
}

/**
 * 409 Conflict
 */
export class ConflictHttpError extends HttpError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 409, context);
  }
}

/**
 * 422 Unprocessable Entity
 */
export class UnprocessableEntityError extends HttpError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 422, context);
  }
}

/**
 * 429 Too Many Requests
 */
export class TooManyRequestsError extends HttpError {
  constructor(
    message: string = "Too many requests",
    context?: Record<string, unknown>,
  ) {
    super(message, 429, context);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends HttpError {
  constructor(
    message: string = "Internal server error",
    context?: Record<string, unknown>,
  ) {
    super(message, 500, context);
  }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableError extends HttpError {
  constructor(
    message: string = "Service unavailable",
    context?: Record<string, unknown>,
  ) {
    super(message, 503, context);
  }
}

/**
 * Helper to convert BaseError to appropriate HttpError
 */
export function toHttpError(error: Error): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  if (error instanceof ValidationError) {
    return new BadRequestError(error.message, error.context);
  }

  if (error instanceof NotFoundError) {
    return new NotFoundHttpError(error.message, error.context);
  }

  if (error instanceof BaseError) {
    return new InternalServerError(error.message, error.context);
  }

  // Unknown error
  return new InternalServerError(
    error.message || "An unexpected error occurred",
    { originalError: error },
  );
}
