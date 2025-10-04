/**
 * Validate Required Fields Utility
 * Validates required fields in request body
 */

import { HttpError } from "@/core/base/errors/HttpError";

/**
 * Validate required fields in request body
 * Throws BadRequestError if any field is missing
 */
export function validateRequiredFields<T extends object>(
  body: T,
  requiredFields: (keyof T)[],
): void {
  const missingFields = requiredFields.filter(
    (field) => body[field] === undefined || body[field] === null,
  );

  if (missingFields.length > 0) {
    throw new HttpError(
      `Missing required fields: ${missingFields.join(", ")}`,
      400,
      { missingFields },
    );
  }
}
