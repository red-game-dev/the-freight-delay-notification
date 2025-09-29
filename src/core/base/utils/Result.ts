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