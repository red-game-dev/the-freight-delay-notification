/**
 * Result type for handling success and failure cases
 * Inspired by functional programming patterns
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  success: true;
  value: T;
}

export interface Failure<E = Error> {
  success: false;
  error: E;
}

export function success<T>(value: T): Success<T> {
  return { success: true, value };
}

export function failure<E = Error>(error: E): Failure<E> {
  return { success: false, error };
}

export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true;
}

export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false;
}

/**
 * Transform the value inside a Result if it's a success
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (result.success) {
    return success(fn(result.value));
  }
  return result;
}

/**
 * Transform the value inside a Result, or return a default value if it's a failure
 */
export function mapOr<T, U, E>(
  result: Result<T, E>,
  defaultValue: U,
  fn: (value: T) => U,
): U {
  if (result.success) {
    return fn(result.value);
  }
  return defaultValue;
}

/**
 * Get the value from a Result, or return a default value if it's a failure
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Chain Result operations (flatMap / bind)
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (result.success) {
    return fn(result.value);
  }
  return result;
}

/**
 * Pass through a Result if it's a failure, otherwise continue
 * Useful for early returns in API handlers
 */
export function passthrough<T, E>(result: Result<T, E>): Result<T, E> | T {
  if (!result.success) {
    return result;
  }
  return result.value;
}

/**
 * Unwrap a Result<T | null> and fail with error if value is null
 * Useful for database queries that may return null
 */
export function unwrapOrFailWith<T, E = Error>(
  result: Result<T | null, E>,
  error: E,
): Result<T, E> {
  if (!result.success) {
    return result;
  }
  if (result.value === null) {
    return failure(error);
  }
  return success(result.value);
}

// Namespace for static methods (allows Result.ok() syntax)
export namespace Result {
  export function ok<T>(value: T): Success<T> {
    return success(value);
  }

  export function fail<E = Error>(error: E): Failure<E> {
    return failure(error);
  }

  export function map<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => U,
  ): Result<U, E> {
    if (result.success) {
      return success(fn(result.value));
    }
    return result;
  }

  export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (result.success) {
      return result.value;
    }
    return defaultValue;
  }

  export function andThen<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>,
  ): Result<U, E> {
    if (result.success) {
      return fn(result.value);
    }
    return result;
  }
}
