/**
 * Parse JSON Body Utility
 * Validates and parses request JSON body
 */

import type { NextRequest } from "next/server";
import { HttpError } from "@/core/base/errors/HttpError";

/**
 * Validate request body and parse JSON
 * Throws BadRequestError if body is invalid
 */
export async function parseJsonBody<T = any>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new HttpError("Invalid JSON body", 400, { error });
  }
}
