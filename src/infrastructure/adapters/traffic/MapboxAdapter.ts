/**
 * Mapbox Traffic Adapter
 * Secondary traffic data provider
 */

import { getErrorMessage, logger } from "@/core/base/utils/Logger";
import { InfrastructureError } from "../../../core/base/errors/BaseError";
import { failure, type Result, success } from "../../../core/base/utils/Result";
import type {
  RouteInput,
  TrafficData,
} from "../../../types/shared/traffic.types";
import { env } from "../../config/EnvValidator";
import type { TrafficAdapter } from "./TrafficAdapter.interface";

export class MapboxAdapter implements TrafficAdapter {
  public readonly providerName = "Mapbox";
  public readonly priority = 2; // Second priority

  private baseUrl = "https://api.mapbox.com";
  private accessToken: string;

  constructor() {
    this.accessToken = env.MAPBOX_ACCESS_TOKEN || "";
  }

  isAvailable(): boolean {
    return !!this.accessToken;
  }

  async getTrafficData(route: RouteInput): Promise<Result<TrafficData>> {
    if (!this.isAvailable()) {
      return failure(
        new InfrastructureError(
          `${this.providerName} access token not configured`,
          { provider: this.providerName },
        ),
      );
    }

    try {
      logger.info(`🗺️ [${this.providerName}] Fetching traffic data...`);

      // Get coordinates for the route
      const coordinates = await this.getCoordinates(route);
      if (!coordinates.success) {
        return failure(coordinates.error);
      }

      const { origin, destination } = coordinates.value;

      // Get directions with traffic
      const trafficUrl =
        `${this.baseUrl}/directions/v5/mapbox/driving-traffic/${origin};${destination}` +
        `?access_token=${this.accessToken}&geometries=geojson&overview=full`;

      const trafficResponse = await fetch(trafficUrl);
      const trafficData = await trafficResponse.json();

      if (!trafficResponse.ok || !trafficData.routes?.length) {
        return failure(
          new InfrastructureError(`${this.providerName}: No route found`, {
            error: trafficData.message || trafficData.error,
            code: trafficData.code,
            route,
          }),
        );
      }

      // Get normal route without traffic
      const normalUrl =
        `${this.baseUrl}/directions/v5/mapbox/driving/${origin};${destination}` +
        `?access_token=${this.accessToken}`;

      const normalResponse = await fetch(normalUrl);
      const normalData = await normalResponse.json();

      const duration = trafficData.routes[0].duration;
      const normalDuration = normalData.routes?.[0]?.duration || duration;
      const distance = trafficData.routes[0].distance;

      // Calculate delay
      const delaySeconds = Math.max(0, duration - normalDuration);
      const delayMinutes = Math.round(delaySeconds / 60);

      // Determine traffic condition
      const delayPercentage =
        normalDuration > 0 ? (delaySeconds / normalDuration) * 100 : 0;
      const trafficCondition = this.getTrafficCondition(delayPercentage);

      const result: TrafficData = {
        delayMinutes,
        trafficCondition,
        estimatedDuration: duration,
        normalDuration,
        fetchedAt: new Date(),
        provider: "mapbox",
        distance: {
          value: distance,
          unit: "meters",
        },
      };

      logger.info(`✅ [${this.providerName}] Success:`, {
        route: `${route.origin} → ${route.destination}`,
        delayMinutes,
        trafficCondition,
        distance: `${(distance / 1000).toFixed(1)}km`,
      });

      return success(result);
    } catch (error: unknown) {
      logger.error(`❌ [${this.providerName}] Error:`, getErrorMessage(error));
      return failure(
        new InfrastructureError(`${this.providerName} request failed`, {
          error: getErrorMessage(error),
          route,
        }),
      );
    }
  }

  private async getCoordinates(
    route: RouteInput,
  ): Promise<Result<{ origin: string; destination: string }>> {
    // Use provided coordinates if available
    if (route.originCoords && route.destinationCoords) {
      return success({
        origin: `${route.originCoords.lng},${route.originCoords.lat}`,
        destination: `${route.destinationCoords.lng},${route.destinationCoords.lat}`,
      });
    }

    // Otherwise geocode the addresses
    try {
      const [originResult, destResult] = await Promise.all([
        this.geocode(route.origin),
        this.geocode(route.destination),
      ]);

      if (!originResult.success || !destResult.success) {
        return failure(
          new InfrastructureError("Failed to geocode addresses", {
            origin: originResult.success ? "ok" : originResult.error,
            destination: destResult.success ? "ok" : destResult.error,
          }),
        );
      }

      return success({
        origin: `${originResult.value.lng},${originResult.value.lat}`,
        destination: `${destResult.value.lng},${destResult.value.lat}`,
      });
    } catch (error: unknown) {
      return failure(
        new InfrastructureError("Geocoding failed", {
          error: getErrorMessage(error),
        }),
      );
    }
  }

  private async geocode(
    address: string,
  ): Promise<Result<{ lat: number; lng: number }>> {
    try {
      const url =
        `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json` +
        `?access_token=${this.accessToken}&limit=1`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.features?.length) {
        return failure(
          new InfrastructureError("Geocoding failed", {
            address,
            error: data.message,
          }),
        );
      }

      const [lng, lat] = data.features[0].center;
      return success({ lat, lng });
    } catch (error: unknown) {
      return failure(
        new InfrastructureError("Geocoding request failed", {
          address,
          error: getErrorMessage(error),
        }),
      );
    }
  }

  private getTrafficCondition(
    delayPercentage: number,
  ): TrafficData["trafficCondition"] {
    if (delayPercentage < 10) return "light";
    if (delayPercentage < 25) return "moderate";
    if (delayPercentage < 50) return "heavy";
    return "severe";
  }
}
