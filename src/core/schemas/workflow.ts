/**
 * Workflow Validation Schemas
 * Zod schemas for workflow-related operations
 */

import { z } from 'zod';
import { uuidSchema } from './common';
import { sanitizeString } from '@/core/utils/validation';

/**
 * Workflow status enum
 */
export const workflowStatusSchema = z.enum([
  'running',
  'completed',
  'failed',
  'cancelled',
  'timed_out',
]);

/**
 * Workflow step enum
 */
export const workflowStepSchema = z.enum([
  'traffic_check',
  'delay_evaluation',
  'message_generation',
  'notification_delivery',
  'completed',
  'failed',
]);

/**
 * Start workflow input schema
 */
export const startWorkflowSchema = z.object({
  delivery_id: uuidSchema,
});

/**
 * Cancel workflow input schema
 */
export const cancelWorkflowSchema = z.object({
  workflowId: z.string().min(1)
    .transform(sanitizeString),
  reason: z.string().max(500).optional()
    .transform(val => val ? sanitizeString(val) : val),
  force: z.boolean().default(false),
});

/**
 * Workflow status query schema
 */
export const workflowStatusQuerySchema = z.object({
  workflowId: z.string().min(1)
    .transform(sanitizeString),
});

/**
 * List workflows query schema
 */
export const listWorkflowsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  delivery_id: uuidSchema.optional(),
  status: z.string().optional()
    .transform(val => val ? sanitizeString(val) : val),
});

/**
 * Type exports
 */
export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;
export type WorkflowStep = z.infer<typeof workflowStepSchema>;
export type StartWorkflowInput = z.infer<typeof startWorkflowSchema>;
export type CancelWorkflowInput = z.infer<typeof cancelWorkflowSchema>;
export type WorkflowStatusQuery = z.infer<typeof workflowStatusQuerySchema>;
export type ListWorkflowsQuery = z.infer<typeof listWorkflowsQuerySchema>;
