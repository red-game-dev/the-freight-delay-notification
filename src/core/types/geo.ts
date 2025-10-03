/**
 * Shared Geographic Types
 * Common type definitions for geographic/coordinate-related operations
 */

/**
 * Coordinate type for geographic locations
 * PostGIS returns {x: lat, y: lng} format
 */
export interface Coordinates {
  x: number; // latitude
  y: number; // longitude
  lat?: number; // alias for x
  lng?: number; // alias for y
}
