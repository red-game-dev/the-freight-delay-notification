/**
 * Google Maps Traffic Adapter
 * Primary traffic data provider
 */

import { Client, TrafficModel, TravelMode } from '@googlemaps/google-maps-services-js';
import { TrafficAdapter } from './TrafficAdapter.interface';
import { Result, success, failure } from '../../../core/base/utils/Result';
import { InfrastructureError } from '../../../core/base/errors/BaseError';
import { TrafficData, RouteInput } from '../../../types/shared/traffic.types';
import { env } from '../../config/EnvValidator';
import { logger, getErrorMessage } from '@/core/base/utils/Logger';

export class GoogleMapsAdapter implements TrafficAdapter {
  public readonly providerName = 'Google Maps';
  public readonly priority = 1; // Highest priority

  private client: Client;
  private apiKey: string;

  constructor() {
    this.client = new Client({});
    this.apiKey = env.GOOGLE_MAPS_API_KEY || '';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async getTrafficData(route: RouteInput): Promise<Result<TrafficData>> {
    if (!this.isAvailable()) {
      return failure(new InfrastructureError(
        `${this.providerName} API key not configured`,
        { provider: this.providerName }
      ));
    }

    try {
      logger.info(`🗺️ [${this.providerName}] Fetching traffic data...`);

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
          `${this.providerName}: ${response.data.status}`,
          {
            status: response.data.status,
            error_message: response.data.error_message,
            route
          }
        ));
      }

      const routeData = response.data.routes[0];
      const leg = routeData.legs[0];

      // Calculate delay
      const durationInTraffic = leg.duration_in_traffic?.value || leg.duration.value;
      const normalDuration = leg.duration.value;
      const delaySeconds = Math.max(0, durationInTraffic - normalDuration);
      const delayMinutes = Math.round(delaySeconds / 60);

      // Determine traffic condition
      const delayPercentage = normalDuration > 0 ? (delaySeconds / normalDuration) * 100 : 0;
      const trafficCondition = this.getTrafficCondition(delayPercentage);

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

      logger.info(`✅ [${this.providerName}] Success:`, {
        route: `${route.origin} → ${route.destination}`,
        delayMinutes,
        trafficCondition,
        distance: `${(leg.distance.value / 1000).toFixed(1)}km`,
      });

      return success(trafficData);
    } catch (error: unknown) {
      logger.error(`❌ [${this.providerName}] Error:`, getErrorMessage(error));
      return failure(new InfrastructureError(
        `${this.providerName} request failed`,
        { error: getErrorMessage(error), route }
      ));
    }
  }

  private getTrafficCondition(delayPercentage: number): TrafficData['trafficCondition'] {
    if (delayPercentage < 10) return 'light';
    if (delayPercentage < 25) return 'moderate';
    if (delayPercentage < 50) return 'heavy';
    return 'severe';
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<Result<{ lat: number; lng: number }>> {
    if (!this.isAvailable()) {
      return failure(new InfrastructureError(
        `${this.providerName} API key not configured`,
        { provider: this.providerName }
      ));
    }

    try {
      logger.info(`🌍 [${this.providerName}] Geocoding address: ${address}`);

      const response = await this.client.geocode({
        params: {
          address,
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK' || !response.data.results.length) {
        return failure(new InfrastructureError(
          `${this.providerName} geocoding failed: ${response.data.status}`,
          {
            status: response.data.status,
            error_message: response.data.error_message,
            address
          }
        ));
      }

      const location = response.data.results[0].geometry.location;

      logger.info(`✅ [${this.providerName}] Geocoded: ${address} → (${location.lat}, ${location.lng})`);

      return success({
        lat: location.lat,
        lng: location.lng,
      });
    } catch (error: unknown) {
      logger.error(`❌ [${this.providerName}] Geocoding error:`, getErrorMessage(error));
      return failure(new InfrastructureError(
        `${this.providerName} geocoding request failed`,
        { error: getErrorMessage(error), address }
      ));
    }
  }
}