/**
 * Geocoding Service
 * Converts addresses to geographic coordinates
 */

import { Result, success, failure } from '../../../core/base/utils/Result';
import { InfrastructureError } from '../../../core/base/errors/BaseError';
import { GoogleMapsAdapter } from '../traffic/GoogleMapsAdapter';

export interface GeocodingResult {
  lat: number;
  lng: number;
  x: number; // PostGIS format (same as lat)
  y: number; // PostGIS format (same as lng)
}

export class GeocodingService {
  private googleMapsAdapter: GoogleMapsAdapter;

  constructor() {
    this.googleMapsAdapter = new GoogleMapsAdapter();
  }

  /**
   * Geocode an address to coordinates
   * Returns coordinates in both {lat,lng} and {x,y} formats
   */
  async geocodeAddress(address: string): Promise<Result<GeocodingResult>> {
    if (!address || address.trim().length === 0) {
      return failure(new InfrastructureError('Address cannot be empty'));
    }

    // Try Google Maps first (highest priority)
    if (this.googleMapsAdapter.isAvailable()) {
      const result = await this.googleMapsAdapter.geocodeAddress(address);
      if (result.success && result.value) {
        return success({
          lat: result.value.lat,
          lng: result.value.lng,
          x: result.value.lat, // PostGIS format
          y: result.value.lng, // PostGIS format
        });
      }
    }

    // If Google Maps fails, return error (can add Mapbox fallback later)
    return failure(new InfrastructureError(
      'Geocoding failed: No geocoding provider available',
      { address }
    ));
  }

  /**
   * Batch geocode multiple addresses
   */
  async geocodeAddresses(addresses: string[]): Promise<Result<GeocodingResult[]>> {
    const results: GeocodingResult[] = [];

    for (const address of addresses) {
      const result = await this.geocodeAddress(address);
      if (!result.success) {
        return failure(new InfrastructureError(
          `Failed to geocode address: ${address}`,
          { address, error: result.error }
        ));
      }
      results.push(result.value);
    }

    return success(results);
  }
}

// Singleton instance
let geocodingServiceInstance: GeocodingService | null = null;

export function getGeocodingService(): GeocodingService {
  if (!geocodingServiceInstance) {
    geocodingServiceInstance = new GeocodingService();
  }
  return geocodingServiceInstance;
}
