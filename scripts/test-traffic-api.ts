/**
 * Test Script for Traffic API Integration
 * Tests the adapter chain with automatic fallback
 */

import { checkTrafficConditions } from '@/workflows/activities';
import { TrafficService } from '../src/infrastructure/adapters/traffic/TrafficService';
import { RouteInput } from '../src/types/shared/traffic.types';

async function testTrafficAPIs() {
  console.log('🧪 Testing Traffic API Integration with Adapter Chain');
  console.log('=====================================================\n');

  // Initialize the traffic service
  const trafficService = new TrafficService();

  // Show available adapters
  console.log('📊 Available Adapters:');
  const adapters = trafficService.getAvailableAdapters();
  adapters.forEach(adapter => {
    console.log(`   - ${adapter.name} (priority: ${adapter.priority})`);
  });

  console.log('\n' + '='.repeat(50) + '\n');

  // Test routes
  const testRoutes: RouteInput[] = [
    {
      origin: '123 Main St, New York, NY',
      destination: '456 Oak Ave, Brooklyn, NY',
    },
    {
      origin: 'Times Square, New York, NY',
      destination: 'Central Park, New York, NY',
    },
    {
      origin: 'Empire State Building, New York, NY',
      destination: 'Brooklyn Bridge, New York, NY',
    },
  ];

  // Test the service with automatic fallback
  console.log('📍 Testing Traffic Service with Automatic Fallback:\n');

  for (const route of testRoutes) {
    console.log(`Route: ${route.origin} → ${route.destination}`);
    console.log('-'.repeat(40));

    const result = await trafficService.getTrafficData(route);

    if (result.success) {
      console.log('✅ Success:', {
        provider: result.value.provider,
        delayMinutes: result.value.delayMinutes,
        condition: result.value.trafficCondition,
        normal: `${Math.round(result.value.normalDuration / 60)}min`,
        withTraffic: `${Math.round(result.value.estimatedDuration / 60)}min`,
        distance: result.value.distance ?
          `${(result.value.distance.value / 1000).toFixed(1)}km` : 'N/A',
      });
    } else {
      console.log('❌ All adapters failed:', result.error.message);
    }

    console.log('');
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test Temporal Activity
  console.log('📍 Testing Temporal Activity...');

  const activityResult = await checkTrafficConditions({
    origin: {
      address: 'Empire State Building, New York, NY',
    },
    destination: {
      address: 'Statue of Liberty, New York, NY',
    },
  });

  console.log('✅ Activity Result:', {
    provider: activityResult.provider,
    delayMinutes: activityResult.delayMinutes,
    condition: activityResult.trafficCondition,
    duration: `${activityResult.estimatedDurationMinutes}min`,
  });

  console.log('\n✨ Traffic API testing complete!');
}

// Run the test
testTrafficAPIs().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});