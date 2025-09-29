/**
 * Traffic Service - Adapter Chain Manager
 * Automatically falls back through all available adapters
 */

import { ITrafficAdapter } from './TrafficAdapter.interface';
import { GoogleMapsAdapter } from './GoogleMapsAdapter';
import { MapboxAdapter } from './MapboxAdapter';
import { MockTrafficAdapter } from './MockTrafficAdapter';
import { Result, failure } from '../../../core/base/utils/Result';
import { InfrastructureError } from '../../../core/base/errors/BaseError';
import { TrafficData, RouteInput } from '../../../types/shared/traffic.types';

export class TrafficService {
  private adapters: ITrafficAdapter[] = [];

  constructor() {
    // Initialize all adapters in priority order
    this.initializeAdapters();
  }

  private initializeAdapters(): void {
    // Add all available adapters
    const allAdapters = [
      new GoogleMapsAdapter(),
      new MapboxAdapter(),
      new MockTrafficAdapter(), // Always available as last resort
    ];

    // Sort by priority and filter available ones
    this.adapters = allAdapters
      .sort((a, b) => a.priority - b.priority)
      .filter(adapter => {
        const available = adapter.isAvailable();
        if (available) {
          console.log(`✅ [TrafficService] ${adapter.providerName} adapter is available (priority: ${adapter.priority})`);
        } else {
          console.log(`⚠️ [TrafficService] ${adapter.providerName} adapter is not configured`);
        }
        return available;
      });

    if (this.adapters.length === 0) {
      // This shouldn't happen since MockTrafficAdapter is always available
      this.adapters = [new MockTrafficAdapter()];
    }

    console.log(`📊 [TrafficService] ${this.adapters.length} adapter(s) available for traffic data`);
  }

  /**
   * Get traffic data using chain of responsibility pattern
   * Automatically falls back through all available adapters
   */
  async getTrafficData(route: RouteInput): Promise<Result<TrafficData>> {
    console.log(`🚦 [TrafficService] Fetching traffic data: ${route.origin} → ${route.destination}`);

    const errors: Array<{ provider: string; error: string }> = [];

    // Try each adapter in priority order
    for (const adapter of this.adapters) {
      console.log(`🔄 [TrafficService] Trying ${adapter.providerName}...`);

      const result = await adapter.getTrafficData(route);

      if (result.success) {
        console.log(`✅ [TrafficService] Success with ${adapter.providerName}`);

        // Log if we had to use fallback
        if (errors.length > 0) {
          console.log(`📝 [TrafficService] Used fallback after ${errors.length} failed attempt(s)`);
        }

        return result;
      }

      // Log the error and continue to next adapter
      errors.push({
        provider: adapter.providerName,
        error: result.error.message
      });

      console.log(`⚠️ [TrafficService] ${adapter.providerName} failed: ${result.error.message}`);
    }

    // All adapters failed (shouldn't happen with MockTrafficAdapter)
    console.error(`❌ [TrafficService] All ${this.adapters.length} adapter(s) failed`);

    return failure(new InfrastructureError(
      'All traffic data adapters failed',
      {
        route,
        errors,
        adaptersAttempted: this.adapters.map(a => a.providerName)
      }
    ));
  }

  /**
   * Get list of available adapters for diagnostics
   */
  getAvailableAdapters(): Array<{ name: string; priority: number }> {
    return this.adapters.map(adapter => ({
      name: adapter.providerName,
      priority: adapter.priority
    }));
  }
}