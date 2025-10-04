/**
 * Create API Handler
 * Higher-order function to create API route handlers with standardized error handling
 */

import type { NextRequest, NextResponse } from "next/server";
import type { Result } from "@/core/base/utils/Result";
import type { ApiHandlerOptions, ApiResponse } from "../types";
import { createErrorResponse } from "./createErrorResponse";
import { handleResult } from "./handleResult";

/**
 * Higher-order function to create API handlers with standardized error handling
 *
 * @example
 * export const GET = createApiHandler(async (request) => {
 *   const db = getDatabaseService();
 *   return await db.listDeliveries();
 * });
 */
export function createApiHandler<T = any>(
  handler: (
    request: NextRequest,
    context?: Record<string, unknown>,
  ) => Promise<Result<T>>,
  options?: ApiHandlerOptions,
) {
  return async (
    request: NextRequest,
    context?: Record<string, unknown>,
  ): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      const result = await handler(request, context);
      return handleResult(result, options);
    } catch (error) {
      // Unexpected errors (not caught by Result pattern)
      const wrappedError =
        error instanceof Error ? error : new Error(String(error));

      return createErrorResponse(wrappedError, options);
    }
  };
}
