/**
 * Create Param API Handler
 * Handler for routes with dynamic parameters (e.g., [id]/route.ts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Result } from '@/core/base/utils/Result';
import type { ApiResponse, ApiHandlerOptions } from '../types';
import { handleResult } from './handleResult';
import { createErrorResponse } from './createErrorResponse';

/**
 * Create API handler for route with params (e.g., [id]/route.ts)
 *
 * @example
 * export const GET = createParamApiHandler(async (request, { params }) => {
 *   const db = getDatabaseService();
 *   return await db.getDeliveryById(params.id);
 * });
 */
export function createParamApiHandler<T = any>(
  handler: (
    request: NextRequest,
    context: { params: any }
  ) => Promise<Result<T>>,
  options?: ApiHandlerOptions
) {
  return async (
    request: NextRequest,
    context: { params: any }
  ): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      const result = await handler(request, context);
      return handleResult(result, options);
    } catch (error) {
      const wrappedError =
        error instanceof Error ? error : new Error(String(error));

      return createErrorResponse(wrappedError, options);
    }
  };
}
