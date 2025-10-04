/**
 * Create API Response
 * Creates standardized success response
 */

import { NextResponse } from "next/server";
import type { ApiHandlerOptions, ApiResponse } from "../types";

/**
 * Create a standardized API success response
 */
export function createApiResponse<T>(
  data: T,
  options?: ApiHandlerOptions,
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (options?.includeTimestamp !== false) {
    response.meta = {
      timestamp: new Date().toISOString(),
    };
  }

  return NextResponse.json(response, {
    status: options?.successStatus || 200,
  });
}
