/**
 * Customer Validation Schemas
 * Zod schemas for customer-related operations
 */

import { z } from "zod";
import { sanitizeString } from "@/core/utils/validation";
import { uuidSchema } from "./common";

/**
 * Create customer input schema
 */
export const createCustomerSchema = z.object({
  name: z.string().min(1).max(200).trim().transform(sanitizeString),
  email: z.string().email().toLowerCase().trim(),
  phone: z
    .string()
    .max(50)
    .trim()
    .optional()
    .transform((val) => val || undefined),
});

/**
 * Update customer input schema
 */
export const updateCustomerSchema = createCustomerSchema.partial();

/**
 * Customer ID param schema
 */
export const customerIdParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Customer email query schema
 */
export const customerEmailQuerySchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

/**
 * Type exports
 */
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerIdParam = z.infer<typeof customerIdParamSchema>;
export type CustomerEmailQuery = z.infer<typeof customerEmailQuerySchema>;
