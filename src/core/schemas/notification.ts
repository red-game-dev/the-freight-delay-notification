/**
 * Notification Validation Schemas
 * Zod schemas for notification-related operations
 */

import { z } from "zod";
import { sanitizeString } from "@/core/utils/validation";
import { uuidSchema } from "./common";

/**
 * Notification channel enum
 */
export const notificationChannelSchema = z.enum(["email", "sms"]);

/**
 * Notification status enum
 */
export const notificationStatusSchema = z.enum([
  "pending",
  "sent",
  "failed",
  "skipped",
]);

/**
 * Create notification input schema
 */
export const createNotificationSchema = z.object({
  delivery_id: uuidSchema,
  customer_id: uuidSchema,
  channel: notificationChannelSchema,
  recipient: z.string().min(1).max(255).trim().transform(sanitizeString),
  message: z.string().min(1).max(5000).trim().transform(sanitizeString),
  subject: z
    .string()
    .max(200)
    .trim()
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
  delay_minutes: z.number().int().min(0).optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

/**
 * Update notification input schema
 */
export const updateNotificationSchema = z.object({
  status: notificationStatusSchema,
  sent_at: z.date().optional(),
  external_id: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
  error_message: z
    .string()
    .max(1000)
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
});

/**
 * List notifications query schema
 */
export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  delivery_id: uuidSchema.optional(),
  customer_id: uuidSchema.optional(),
  status: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
  channel: notificationChannelSchema.optional(),
  includeStats: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

/**
 * Notification ID param schema
 */
export const notificationIdParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Type exports
 */
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;
export type NotificationStatus = z.infer<typeof notificationStatusSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
