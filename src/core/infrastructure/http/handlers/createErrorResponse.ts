/**
 * Create Error Response
 * Creates standardized error response
 */

import { NextResponse } from 'next/server';
import { logger, getErrorMessage, hasMessage, hasCode, hasName, hasCause } from '@/core/base/utils/Logger';
import { toHttpError } from '@/core/base/errors/HttpError';
import type { ApiResponse, ApiHandlerOptions } from '../types';
import { isDevelopment } from '@/core/base/utils/environment';

/**
 * Create a standardized error response
 * Converts any error to HttpError and logs it
 */
export function createErrorResponse(
  error: Error,
  options?: ApiHandlerOptions
): NextResponse<ApiResponse> {
  // Convert to HttpError
  const httpError = toHttpError(error);

  // Call custom error handler if provided
  options?.onError?.(error);

  // Log the error
  logger.error(`API Error: ${httpError.message}`, {
    code: httpError.code,
    statusCode: httpError.statusCode,
    stack: httpError.stack,
    context: httpError.context,
  });

  const response: ApiResponse = {
    success: false,
    error: {
      message: httpError.message,
      code: httpError.code,
      ...(isDevelopment() && {
        details: httpError.context,
      }),
    },
  };

  if (options?.includeTimestamp !== false) {
    response.meta = {
      timestamp: new Date().toISOString(),
    };
  }

  return NextResponse.json(response, {
    status: httpError.statusCode,
  });
}
