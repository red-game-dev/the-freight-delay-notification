/**
 * Google Maps API Client
 * PDF Step 1: Primary traffic data source
 */

import { Client, TrafficModel, TravelMode } from '@googlemaps/google-maps-services-js';
import { env } from '../../config/EnvValidator';
import { Result, success, failure } from '../../../core/base/utils/Result';
import { InfrastructureError } from '../../../core/base/errors/BaseError';
import { TrafficData, RouteInput } from '../../../types/shared/traffic.types';

export class GoogleMapsClient {
  private client: Client;
  private apiKey: string;

  constructor() {
    this.client = new Client({});
    this.apiKey = env.GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * PDF Requirement: Fetch traffic data for route (Step 1)
   * Returns delay in minutes and traffic conditions
   */
  async getTrafficData(route: RouteInput): Promise<Result<TrafficData>> {
    try {
      // Check if API key is configured
      if (!this.apiKey) {
        console.log('⚠️ Google Maps API key not configured, skipping...');
        return failure(new InfrastructureError(
          'Google Maps API key not configured',
          { route }
        ));
      }

      console.log(`🗺️ Fetching Google Maps traffic data...`);

      // Get directions with traffic data
      const response = await this.client.directions({
        params: {
          origin: route.origin,
          destination: route.destination,
          departure_time: route.departureTime || 'now',
          traffic_model: TrafficModel.best_guess,
          mode: TravelMode.driving,
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK' || !response.data.routes.length) {
        return failure(new InfrastructureError(
          `Google Maps API error: ${response.data.status}`,
          {
            status: response.data.status,
            error_message: response.data.error_message,
            route
          }
        ));
      }

      const routeData = response.data.routes[0];
      const leg = routeData.legs[0];

      // Get duration in traffic vs normal duration
      const durationInTraffic = leg.duration_in_traffic?.value || leg.duration.value;
      const normalDuration = leg.duration.value;
      const delaySeconds = Math.max(0, durationInTraffic - normalDuration);
      const delayMinutes = Math.round(delaySeconds / 60);

      // Determine traffic condition based on delay percentage
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
        estimatedDuration: durationInTraffic,
        normalDuration,
        fetchedAt: new Date(),
        provider: 'google',
        distance: {
          value: leg.distance.value,
          unit: 'meters',
        },
      };

      // PDF Requirement: Console logging for key steps
      console.log(`📊 Google Maps traffic data:`, {
        route: `${route.origin} → ${route.destination}`,
        delayMinutes,
        trafficCondition,
        normalDuration: `${Math.round(normalDuration / 60)}min`,
        estimatedDuration: `${Math.round(durationInTraffic / 60)}min`,
        distance: `${(leg.distance.value / 1000).toFixed(1)}km`,
      });

      return success(trafficData);
    } catch (error: any) {
      console.error('❌ Google Maps API error:', error.message);
      return failure(new InfrastructureError(
        'Failed to fetch traffic data from Google Maps',
        { error: error.message, route }
      ));
    }
  }
}