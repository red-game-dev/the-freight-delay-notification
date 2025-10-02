/**
 * ID Generation Utilities
 * Functions for generating unique identifiers
 */

/**
 * Generate a random ID with optional prefix
 * Format: {prefix}-{timestamp}-{random}
 */
export function generateRandomId(prefix?: string): string {
  const randomPart = Math.random().toString(36).substring(2, 11);
  const timestampPart = Date.now();
  return prefix ? `${prefix}-${timestampPart}-${randomPart}` : `${timestampPart}-${randomPart}`;
}

/**
 * Generate a short random ID
 * Useful for temporary/UI-only IDs
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(7);
}
