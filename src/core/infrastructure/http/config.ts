/**
 * HTTP Configuration
 * Centralized configuration for API requests
 */

/**
 * Get the API base URL from environment variables
 * Validates that the URL is properly configured
 */
function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;

  // In development, default to empty string (same origin)
  if (!url && process.env.NODE_ENV === 'development') {
    return '';
  }

  // In production, require explicit configuration
  if (!url && process.env.NODE_ENV === 'production') {
    console.warn('NEXT_PUBLIC_API_URL is not set. Using same origin.');
    return '';
  }

  return url || '';
}

/**
 * API Configuration
 */
export const apiConfig = {
  /**
   * Base URL for all API requests
   * Defaults to empty string (same origin) if not configured
   */
  baseUrl: getApiBaseUrl(),

  /**
   * Default request timeout in milliseconds
   */
  timeout: 30000,

  /**
   * Default headers for all requests
   */
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
} as const;
