/**
 * Base Error Classes for Clean Architecture
 */

export abstract class BaseError extends Error {
  constructor(
    public readonly message: string,
    public readonly context?: Record<string, unknown>,
    public readonly code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}

export class DomainError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context, 'DOMAIN_ERROR');
  }
}

export class InfrastructureError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context, 'INFRASTRUCTURE_ERROR');
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context, 'NOT_FOUND');
  }
}

export class ConflictError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context, 'CONFLICT');
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context, 'UNAUTHORIZED');
  }
}