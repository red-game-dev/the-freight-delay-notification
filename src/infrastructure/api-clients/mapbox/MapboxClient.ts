/**
 * Mapbox API Client
 * PDF Step 1: Fallback traffic data source
 */

import { env } from '../../config/EnvValidator';
import { Result, success, failure } from '../../../core/base/utils/Result';
import { InfrastructureError } from '../../../core/base/errors/BaseError';
import { TrafficData, RouteInput } from '../../../types/shared/traffic.types';

export class MapboxClient {
  private baseUrl = 'https://api.mapbox.com';
  private accessToken: string;

  constructor() {
    this.accessToken = env.MAPBOX_ACCESS_TOKEN || '';
  }

  /**
   * PDF Requirement: Alternative traffic API (fallback for Google Maps)
   * Mapbox Directions API with traffic-aware routing
   */
  async getTrafficData(route: RouteInput): Promise<Result<TrafficData>> {
    try {
      // Check if API token is configured
      if (!this.accessToken) {
        console.log('⚠️ Mapbox access token not configured, skipping...');
        return failure(new InfrastructureError(
          'Mapbox access token not configured',
          { route }
        ));
      }

      console.log(`🗺️ Fetching Mapbox traffic data (fallback)...`);

      // Convert addresses to coordinates if not provided
      let origin: string, destination: string;

      if (route.originCoords && route.destinationCoords) {
        origin = `${route.originCoords.lng},${route.originCoords.lat}`;
        destination = `${route.destinationCoords.lng},${route.destinationCoords.lat}`;
      } else {
        // Geocode addresses first
        const originCoords = await this.geocode(route.origin);
        const destCoords = await this.geocode(route.destination);

        if (!originCoords.success || !destCoords.success) {
          return failure(new InfrastructureError(
            'Failed to geocode addresses for Mapbox',
            {
              route,
              originError: !originCoords.success ? originCoords.error : null,
              destError: !destCoords.success ? destCoords.error : null
            }
          ));
        }

        origin = `${originCoords.value.lng},${originCoords.value.lat}`;
        destination = `${destCoords.value.lng},${destCoords.value.lat}`;
      }

      // Get directions with current traffic
      const url = `${this.baseUrl}/directions/v5/mapbox/driving-traffic/${origin};${destination}` +
        `?access_token=${this.accessToken}&geometries=geojson&overview=full`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.routes?.length) {
        return failure(new InfrastructureError(
          'No route found from Mapbox',
          {
            origin: route.origin,
            destination: route.destination,
            error: data.message || data.error,
            code: data.code
          }
        ));
      }

      const routeData = data.routes[0];
      const duration = routeData.duration; // Duration with current traffic
      const distance = routeData.distance; // Distance in meters

      // Get route without traffic for comparison
      const normalUrl = `${this.baseUrl}/directions/v5/mapbox/driving/${origin};${destination}` +
        `?access_token=${this.accessToken}`;

      const normalResponse = await fetch(normalUrl);
      const normalData = await normalResponse.json();

      const normalDuration = normalData.routes?.[0]?.duration || duration;
      const delaySeconds = Math.max(0, duration - normalDuration);
      const delayMinutes = Math.round(delaySeconds / 60);

      // Determine traffic condition
      const delayPercentage = normalDuration > 0 ? (delaySeconds / normalDuration) * 100 : 0;
      let trafficCondition: TrafficData['trafficCondition'];

      if (delayPercentage < 10) {
        trafficCondition = 'light';
      } else if (delayPercentage < 25) {
        trafficCondition = 'moderate';
      } else if (delayPercentage < 50) {
        trafficCondition = 'heavy';
      } else {
        trafficCondition = 'severe';
      }

      const trafficData: TrafficData = {
        delayMinutes,
        trafficCondition,
        estimatedDuration: duration,
        normalDuration,
        fetchedAt: new Date(),
        provider: 'mapbox',
        distance: {
          value: distance,
          unit: 'meters',
        },
      };

      // PDF Requirement: Console logging for key steps
      console.log(`📊 Mapbox traffic data:`, {
        route: `${route.origin} → ${route.destination}`,
        delayMinutes,
        trafficCondition,
        normalDuration: `${Math.round(normalDuration / 60)}min`,
        estimatedDuration: `${Math.round(duration / 60)}min`,
        distance: `${(distance / 1000).toFixed(1)}km`,
      });

      return success(trafficData);
    } catch (error: any) {
      console.error('❌ Mapbox API error:', error.message);
      return failure(new InfrastructureError(
        'Failed to fetch traffic data from Mapbox',
        { error: error.message, route }
      ));
    }
  }

  /**
   * Geocode address to coordinates using Mapbox
   */
  private async geocode(address: string): Promise<Result<{ lat: number; lng: number }>> {
    try {
      const url = `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json` +
        `?access_token=${this.accessToken}&limit=1`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.features?.length) {
        return failure(new InfrastructureError(
          'Failed to geocode address',
          { address, error: data.message }
        ));
      }

      const [lng, lat] = data.features[0].center;
      return success({ lat, lng });
    } catch (error: any) {
      return failure(new InfrastructureError(
        'Geocoding failed',
        { address, error: error.message }
      ));
    }
  }
}