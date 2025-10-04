/**
 * Create Param API Handler
 * Handler for routes with dynamic parameters (e.g., [id]/route.ts)
 */

import type { NextRequest, NextResponse } from "next/server";
import type { Result } from "@/core/base/utils/Result";
import type { ApiHandlerOptions, ApiResponse } from "../types";
import { createErrorResponse } from "./createErrorResponse";
import { handleResult } from "./handleResult";

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
    context: { params: Record<string, string> },
  ) => Promise<Result<T>>,
  options?: ApiHandlerOptions,
) {
  return async (
    request: NextRequest,
    context: {
      params: Promise<Record<string, string>> | Record<string, string>;
    },
  ): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      // Handle Next.js 15's async params
      const params =
        context.params instanceof Promise
          ? await context.params
          : context.params;
      const result = await handler(request, { params });
      return handleResult(result, options);
    } catch (error) {
      const wrappedError =
        error instanceof Error ? error : new Error(String(error));

      return createErrorResponse(wrappedError, options);
    }
  };
}
