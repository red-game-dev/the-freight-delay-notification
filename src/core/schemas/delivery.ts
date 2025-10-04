/**
 * Delivery Validation Schemas
 * Zod schemas for delivery-related operations
 */

import { z } from "zod";
import { sanitizeString } from "@/core/utils/validation";
import { emailSchema, phoneSchema, uuidSchema } from "./common";

/**
 * Delivery status enum
 */
export const deliveryStatusSchema = z.enum([
  "pending",
  "in_transit",
  "delayed",
  "delivered",
  "cancelled",
  "failed",
]);

/**
 * Create delivery input schema
 */
export const createDeliverySchema = z.object({
  tracking_number: z.string().min(1).max(100).trim().transform(sanitizeString),
  origin: z.string().min(1).max(500).trim().transform(sanitizeString),
  destination: z.string().min(1).max(500).trim().transform(sanitizeString),
  scheduled_delivery: z.string().transform((val) => {
    // If already ISO format, return as is
    if (val.includes("Z") || val.includes("+")) return val;
    // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO
    return new Date(val).toISOString();
  }),
  customer_name: z.string().min(1).max(200).trim().transform(sanitizeString),
  customer_email: emailSchema,
  customer_phone: phoneSchema,
  notes: z
    .string()
    .max(1000)
    .trim()
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
  auto_check_traffic: z.boolean().default(false),
  enable_recurring_checks: z.boolean().default(false),
  check_interval_minutes: z
    .union([z.number().int().min(5).max(43200), z.null(), z.literal("")])
    .transform((val) => {
      if (val === null || val === "") return undefined;
      return val;
    })
    .optional(),
  max_checks: z
    .union([z.number().int().min(-1).max(1000), z.null(), z.literal("")])
    .transform((val) => {
      if (val === null || val === "") return -1;
      return val;
    })
    .default(-1),
  delay_threshold_minutes: z
    .union([z.number().int().min(1).max(1440), z.null(), z.literal("")])
    .transform((val) => {
      if (val === null || val === "") return undefined;
      return val;
    })
    .optional(),
  min_delay_change_threshold: z
    .union([z.number().min(0).max(1440), z.null(), z.literal("")])
    .transform((val) => {
      if (val === null || val === "") return undefined;
      return val;
    })
    .optional(),
  min_hours_between_notifications: z
    .union([z.number().min(0).max(72), z.null(), z.literal("")])
    .transform((val) => {
      if (val === null || val === "") return undefined;
      return val;
    })
    .optional(),
});

/**
 * Update delivery input schema
 */
export const updateDeliverySchema = createDeliverySchema.partial().extend({
  status: deliveryStatusSchema.optional(),
});

/**
 * Delivery ID param schema
 */
export const deliveryIdParamSchema = z.object({
  id: uuidSchema,
});

/**
 * List deliveries query schema
 */
export const listDeliveriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
  customer_id: uuidSchema.optional(),
  tracking_number: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
});

/**
 * Type exports
 */
export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>;
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryInput = z.infer<typeof updateDeliverySchema>;
export type DeliveryIdParam = z.infer<typeof deliveryIdParamSchema>;
export type ListDeliveriesQuery = z.infer<typeof listDeliveriesQuerySchema>;
