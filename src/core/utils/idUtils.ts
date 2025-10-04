/**
 * ID Generation Utilities
 * Universal ID generation using nanoid
 */

import { nanoid } from 'nanoid';

/**
 * Generate a standard ID (21 characters, URL-safe)
 * Use this for most application IDs (request IDs, temporary IDs, etc.)
 *
 * @example
 * generateId() // "V1StGXR8_Z5jdHi6B-myT"
 */
export function generateId(): string {
  return nanoid();
}

/**
 * Generate a random ID with optional prefix
 * Format: {prefix}-{nanoid}
 *
 * @param prefix - Optional prefix for the ID
 * @example
 * generateRandomId('req') // "req-V1StGXR8_Z5jdHi6B-myT"
 * generateRandomId() // "V1StGXR8_Z5jdHi6B-myT"
 */
export function generateRandomId(prefix?: string): string {
  const id = nanoid();
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Generate a short random ID (8 characters)
 * Useful for UI component keys, temporary/non-critical IDs
 *
 * Note: Higher collision probability than standard IDs
 * Only use for temporary/UI purposes, not for database records
 *
 * @example
 * generateShortId() // "V1StGXR8"
 */
export function generateShortId(): string {
  return nanoid(8);
}

/**
 * Generate a UUID-compatible ID
 * Returns a standard nanoid but can be used where UUIDs are expected
 * Note: This is NOT a real UUID - database should generate those
 *
 * @example
 * generateUuidLike() // "V1StGXR8_Z5jdHi6B-myT"
 */
export function generateUuidLike(): string {
  return nanoid();
}
