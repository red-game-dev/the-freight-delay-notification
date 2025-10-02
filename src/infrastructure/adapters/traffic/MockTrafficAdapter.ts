/**
 * Mock Traffic Adapter
 * Fallback for testing when no API keys are configured
 */

import { TrafficAdapter } from './TrafficAdapter.interface';
import { Result, success } from '../../../core/base/utils/Result';
import { TrafficData, RouteInput } from '../../../types/shared/traffic.types';
import { logger } from '@/core/base/utils/Logger';

export class MockTrafficAdapter implements TrafficAdapter {
  public readonly providerName = 'Mock Data';
  public readonly priority = 999; // Lowest priority (last resort)

  isAvailable(): boolean {
    return true; // Always available as last resort
  }

  async getTrafficData(route: RouteInput): Promise<Result<TrafficData>> {
    logger.info(`🎭 [${this.providerName}] Using mock traffic data for testing`);

    // Generate somewhat random but consistent delay based on route
    const routeHash = this.hashRoute(route);
    const baseDelay = 15 + (routeHash % 45); // 15-60 minutes
    const delayMinutes = Math.round(baseDelay);

    // Determine traffic condition based on delay
    let trafficCondition: TrafficData['trafficCondition'];
    if (delayMinutes < 20) {
      trafficCondition = 'light';
    } else if (delayMinutes < 35) {
      trafficCondition = 'moderate';
    } else if (delayMinutes < 50) {
      trafficCondition = 'heavy';
    } else {
      trafficCondition = 'severe';
    }

    const normalDuration = 30 * 60; // 30 minutes in seconds
    const estimatedDuration = normalDuration + (delayMinutes * 60);

    const mockData: TrafficData = {
      delayMinutes,
      trafficCondition,
      estimatedDuration,
      normalDuration,
      fetchedAt: new Date(),
      provider: 'mapbox', // Pretend to be mapbox for consistency
      distance: {
        value: 15000 + (routeHash % 20000), // 15-35km
        unit: 'meters',
      },
    };

    logger.info(`✅ [${this.providerName}] Generated:`, {
      route: `${route.origin} → ${route.destination}`,
      delayMinutes,
      trafficCondition,
      normalDuration: `${Math.round(normalDuration / 60)}min`,
      estimatedDuration: `${Math.round(estimatedDuration / 60)}min`,
    });

    return success(mockData);
  }

  private hashRoute(route: RouteInput): number {
    const str = `${route.origin}-${route.destination}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}