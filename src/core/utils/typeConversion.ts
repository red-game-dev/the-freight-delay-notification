/**
 * Type Conversion Utilities
 * Safe type conversion functions that handle edge cases
 */

/**
 * Ensure a value is an ISO string
 * Handles Date, string, null, and undefined inputs
 */
export function ensureDateISO(
  value: Date | string | undefined | null,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.toISOString();
}
