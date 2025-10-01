/**
 * Query Params Utilities
 * Helpers for extracting query parameters from requests
 */

import { NextRequest } from 'next/server';

/**
 * Get single query parameter from URL
 */
export function getQueryParam(
  request: NextRequest,
  param: string
): string | null {
  const { searchParams } = new URL(request.url);
  return searchParams.get(param);
}

/**
 * Get multiple query parameters
 * Returns object with parameter names as keys
 */
export function getQueryParams(
  request: NextRequest,
  params: string[]
): Record<string, string | null> {
  const { searchParams } = new URL(request.url);
  return params.reduce(
    (acc, param) => {
      acc[param] = searchParams.get(param);
      return acc;
    },
    {} as Record<string, string | null>
  );
}

/**
 * Get all query parameters as object
 */
export function getAllQueryParams(request: NextRequest): Record<string, string> {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}
