/**
 * Coordinate and Geometry Utilities
 * Functions for converting between different coordinate formats (PostGIS, objects, strings)
 */

import type { Coordinates } from '@/infrastructure/database/types/database.types';

/**
 * Convert PostGIS POINT string or object to Coordinates
 * Handles formats: "POINT(lng lat)", "(lng,lat)", or {x, y} objects
 */
export function pointToCoordinates(
  point: string | { x: number; y: number } | null | undefined
): Coordinates | null {
  if (!point) return null;

  // If already an object with x/y (PostGIS can return parsed objects)
  if (typeof point === 'object' && 'x' in point && 'y' in point) {
    return {
      x: point.x,
      y: point.y,
      lat: point.x,
      lng: point.y,
    };
  }

  // If string format "(lng,lat)" or "POINT(lng lat)" or "lng,lat"
  if (typeof point === 'string') {
    // Remove POINT() wrapper if present and parentheses
    const cleaned = point
      .replace(/^POINT\s*\(/i, '')
      .replace(/\)$/, '')
      .replace(/[()]/g, '');

    // Split by comma or space
    const parts = cleaned
      .split(/[,\s]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (parts.length === 2) {
      const [lng, lat] = parts;
      return { x: lat, y: lng, lat, lng };
    }
  }

  return null;
}

/**
 * Convert Coordinates to PostGIS POINT string format
 * Format: "POINT(lng lat)"
 */
export function coordinatesToPostGISPoint(coords: Coordinates): string {
  const lat = coords.lat ?? coords.x;
  const lng = coords.lng ?? coords.y;
  return `POINT(${lng} ${lat})`;
}

/**
 * Convert Coordinates to simple point string
 * Format: "(lng,lat)"
 */
export function coordinatesToPoint(coords: Coordinates): string {
  const lat = coords.lat ?? coords.x;
  const lng = coords.lng ?? coords.y;
  return `(${lng},${lat})`;
}

/**
 * Calculate the midpoint between two coordinates
 */
export function getMidpoint(coord1: Coordinates, coord2: Coordinates): Coordinates {
  const lat1 = coord1.lat ?? coord1.x;
  const lng1 = coord1.lng ?? coord1.y;
  const lat2 = coord2.lat ?? coord2.x;
  const lng2 = coord2.lng ?? coord2.y;

  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  return {
    x: midLat,
    y: midLng,
    lat: midLat,
    lng: midLng,
  };
}

/**
 * Validate if coordinates are valid (non-zero, within bounds)
 */
export function isValidCoordinates(coords: Coordinates | null | undefined): coords is Coordinates {
  if (!coords) return false;

  const lat = coords.lat ?? coords.x;
  const lng = coords.lng ?? coords.y;

  // Check if values exist and are numbers
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;

  // Check if not NaN
  if (isNaN(lat) || isNaN(lng)) return false;

  // Check if within valid ranges (-90 to 90 for lat, -180 to 180 for lng)
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;

  return true;
}

/**
 * Create Coordinates object from lat/lng values
 */
export function createCoordinates(lat: number, lng: number): Coordinates {
  return { x: lat, y: lng, lat, lng };
}
