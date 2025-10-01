/**
 * Fetch JSON Utility
 * Standardized fetch wrapper using existing HttpError system
 */

import { BadRequestError, NotFoundHttpError, InternalServerError, HttpError } from '@/core/base/errors/HttpError';

/**
 * Fetch JSON with automatic error handling using HttpError
 *
 * @example
 * ```typescript
 * const data = await fetchJson<Delivery[]>('/api/deliveries');
 * ```
 */
export async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorData: any;
      let errorMessage: string;

      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`;
        errorData = { message: errorMessage };
      }

      // Map to appropriate HttpError based on status code
      switch (response.status) {
        case 400:
          throw new BadRequestError(errorMessage, errorData);
        case 404:
          throw new NotFoundHttpError(errorMessage, errorData);
        case 500:
        default:
          throw new InternalServerError(errorMessage, errorData);
      }
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const json = await response.json();

    // Unwrap API response if it has the standard format { success, data }
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T;
    }

    return json as T;
  } catch (error) {
    // Re-throw HttpError as-is
    if (error instanceof HttpError) {
      throw error;
    }

    // Wrap network/parsing errors
    if (error instanceof Error) {
      throw new InternalServerError(
        error.message || 'Network error',
        { originalError: error }
      );
    }

    // Unknown error
    throw new InternalServerError(
      'An unexpected error occurred',
      { originalError: error }
    );
  }
}
