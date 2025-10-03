/**
 * Threshold Validation Schemas
 * Zod schemas for threshold-related operations
 */

import { z } from 'zod';
import { uuidSchema } from './common';
import { sanitizeString } from '@/core/utils/validation';
import { notificationChannelSchema } from './notification';

/**
 * Create threshold input schema
 */
export const createThresholdSchema = z.object({
  name: z.string().min(1).max(200).trim()
    .transform(sanitizeString),
  delay_minutes: z.number().int().min(0).max(1440),
  notification_channels: z.array(notificationChannelSchema).min(1),
  is_default: z.boolean().default(false),
});

/**
 * Update threshold input schema
 */
export const updateThresholdSchema = createThresholdSchema.partial();

/**
 * Threshold ID param schema
 */
export const thresholdIdParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Type exports
 */
export type CreateThresholdInput = z.infer<typeof createThresholdSchema>;
export type UpdateThresholdInput = z.infer<typeof updateThresholdSchema>;
export type ThresholdIdParam = z.infer<typeof thresholdIdParamSchema>;
