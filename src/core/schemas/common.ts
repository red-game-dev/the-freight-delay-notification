/**
 * Common Validation Schemas
 * Shared Zod schemas used across the application
 */

import { z } from 'zod';

/**
 * Coordinates schema
 */
export const coordinatesSchema = z.object({
  x: z.number().min(-90).max(90), // latitude
  y: z.number().min(-180).max(180), // longitude
  lat: z.number().min(-90).max(90).optional(), // alias for x
  lng: z.number().min(-180).max(180).optional(), // alias for y
});

/**
 * UUID schema
 */
export const uuidSchema = z.string().uuid();

/**
 * Email schema
 */
export const emailSchema = z.string().email().toLowerCase().trim();

/**
 * Phone schema (basic validation)
 */
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/).optional();

/**
 * ISO 8601 date string schema
 */
export const isoDateSchema = z.string().datetime();

/**
 * Pagination schema
 */
export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * Query parameter helpers
 */
export const queryParamString = z.string().optional();
export const queryParamNumber = z.coerce.number().optional();
export const queryParamBoolean = z.enum(['true', 'false']).transform(val => val === 'true').optional();
