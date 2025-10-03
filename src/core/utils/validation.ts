/**
 * Validation Utilities
 * Helpers for validating and sanitizing data using Zod schemas
 */

import { z } from 'zod';
import { Result } from '@/core/base/utils/Result';
import { ValidationError } from '@/core/base/errors/BaseError';

/**
 * Validate data against a Zod schema
 * Returns a Result type with either the validated data or a ValidationError
 */
export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown
): Result<z.infer<T>> {
  try {
    const validated = schema.parse(data);
    return Result.ok(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return Result.fail(new ValidationError(message, { errors: error.errors }));
    }
    return Result.fail(new ValidationError('Validation failed', { error }));
  }
}

/**
 * Validate and parse query parameters from a URL
 * Automatically handles URLSearchParams conversion
 */
export function validateQuery<T extends z.ZodType>(
  schema: T,
  request: Request
): Result<z.infer<T>> {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    return validate(schema, params);
  } catch (error) {
    return Result.fail(new ValidationError('Invalid query parameters', { error }));
  }
}

/**
 * Validate and parse JSON body from a request
 */
export async function validateBody<T extends z.ZodType>(
  schema: T,
  request: Request
): Promise<Result<z.infer<T>>> {
  try {
    const body = await request.json();
    return validate(schema, body);
  } catch (error) {
    return Result.fail(new ValidationError('Invalid request body', { error }));
  }
}

/**
 * Validate route parameters
 */
export function validateParams<T extends z.ZodType>(
  schema: T,
  params: unknown
): Result<z.infer<T>> {
  return validate(schema, params);
}

/**
 * Safe parse utility that doesn't throw
 * Returns undefined if validation fails
 */
export function safeParse<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> | undefined {
  const result = schema.safeParse(data);
  return result.success ? result.data : undefined;
}

/**
 * Sanitize string input by trimming and removing dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove inline event handlers
}

/**
 * Sanitize HTML by stripping all tags
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Create a validation middleware for API routes
 */
export function createValidator<T extends z.ZodType>(schema: T) {
  return {
    body: (request: Request) => validateBody(schema, request),
    query: (request: Request) => validateQuery(schema, request),
    params: (params: unknown) => validateParams(schema, params),
  };
}
