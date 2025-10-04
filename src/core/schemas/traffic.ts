/**
 * Traffic Validation Schemas
 * Zod schemas for traffic-related operations
 */

import { z } from "zod";
import { sanitizeString } from "@/core/utils/validation";
import { coordinatesSchema, uuidSchema } from "./common";

/**
 * Traffic condition enum
 */
export const trafficConditionSchema = z.enum([
  "light",
  "moderate",
  "heavy",
  "severe",
]);

/**
 * Traffic severity enum
 */
export const trafficSeveritySchema = z.enum([
  "minor",
  "moderate",
  "major",
  "severe",
]);

/**
 * Traffic incident type enum
 */
export const trafficIncidentTypeSchema = z.enum([
  "accident",
  "construction",
  "road_closure",
  "weather",
  "congestion",
  "other",
]);

/**
 * Create traffic snapshot schema
 */
export const createTrafficSnapshotSchema = z.object({
  route_id: uuidSchema,
  traffic_condition: trafficConditionSchema,
  delay_minutes: z.number().int().min(0),
  duration_seconds: z.number().int().min(0),
  description: z
    .string()
    .max(500)
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
  severity: trafficSeveritySchema.optional(),
  affected_area: z
    .string()
    .max(500)
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
  incident_type: trafficIncidentTypeSchema.optional(),
  incident_location: coordinatesSchema.optional(),
});

/**
 * List traffic snapshots query schema
 */
export const listTrafficSnapshotsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  route_id: uuidSchema.optional(),
  condition: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeString(val) : val)),
  deliveryStatus: z
    .string()
    .optional()
    .default("in_transit,delayed")
    .transform(sanitizeString),
});

/**
 * Type exports
 */
export type TrafficCondition = z.infer<typeof trafficConditionSchema>;
export type TrafficSeverity = z.infer<typeof trafficSeveritySchema>;
export type TrafficIncidentType = z.infer<typeof trafficIncidentTypeSchema>;
export type CreateTrafficSnapshotInput = z.infer<
  typeof createTrafficSnapshotSchema
>;
export type ListTrafficSnapshotsQuery = z.infer<
  typeof listTrafficSnapshotsQuerySchema
>;
