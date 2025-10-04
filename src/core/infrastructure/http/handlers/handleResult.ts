/**
 * Handle Result Type
 * Converts Result<T> to API response
 */

import type { NextResponse } from "next/server";
import type { Result } from "@/core/base/utils/Result";
import type { ApiHandlerOptions, ApiResponse } from "../types";
import { createApiResponse } from "./createApiResponse";
import { createErrorResponse } from "./createErrorResponse";

/**
 * Handle Result type and convert to API response
 * Maps success/error to appropriate response format
 */
export function handleResult<T>(
  result: Result<T>,
  options?: ApiHandlerOptions,
): NextResponse<ApiResponse<T>> {
  if (result.success) {
    return createApiResponse(result.value, options);
  }

  return createErrorResponse(result.error, options);
}
