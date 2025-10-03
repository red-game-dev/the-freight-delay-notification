/**
 * Maps Utilities
 * Reusable utilities for Google Maps integration
 */

/**
 * Build Google Maps directions URL
 * Creates a shareable URL that opens Google Maps with directions
 */
export function buildGoogleMapsDirectionsUrl(
  origin: string,
  destination: string,
  travelMode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): string | null {
  if (!origin || !destination) {
    return null;
  }

  const params = new URLSearchParams({
    api: '1',
    origin: origin,
    destination: destination,
    travelmode: travelMode,
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Build Google Maps search URL for a single address
 */
export function buildGoogleMapsSearchUrl(address: string): string | null {
  if (!address) {
    return null;
  }

  const params = new URLSearchParams({
    api: '1',
    query: address,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/**
 * Build Google Maps place URL with coordinates
 */
export function buildGoogleMapsPlaceUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    api: '1',
    query: `${lat},${lng}`,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/**
 * Calculate center point of multiple coordinates
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

export function calculateCenter(points: Coordinates[]): Coordinates {
  if (points.length === 0) {
    return { lat: 40.7128, lng: -74.0060 }; // Default: NYC
  }

  const total = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.lat,
      lng: acc.lng + point.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: total.lat / points.length,
    lng: total.lng / points.length,
  };
}

/**
 * Validate coordinates are within valid ranges
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    lat !== 0 &&
    lng !== 0
  );
}
