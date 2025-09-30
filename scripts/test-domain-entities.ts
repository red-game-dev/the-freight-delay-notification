/**
 * Quick test for Domain Entities
 */

import { Delivery, DeliveryStatus, Route, Coordinates } from '../src/core/domain/delivery/index.js';

console.log('🧪 Testing Domain Entities\n');
console.log('═'.repeat(60));

// Test 1: Delivery threshold checking (PDF Step 2)
console.log('\n📝 Test 1: Delivery threshold checking (PDF Step 2)');
const delivery = Delivery.create({
  trackingNumber: 'TEST-001',
  customerId: 'c1',
  routeId: 'r1',
  status: DeliveryStatus.inTransit(),
  scheduledDelivery: new Date(),
  delayThresholdMinutes: 30,
}, 'd1');

console.log('Created delivery:', delivery.trackingNumber);
console.log('Threshold:', delivery.delayThresholdMinutes, 'minutes');

const test45 = delivery.shouldNotifyForDelay(45);
const test30 = delivery.shouldNotifyForDelay(30);
const test15 = delivery.shouldNotifyForDelay(15);

console.log(`\n✅ Should notify for 45 min delay? ${test45} (expected: true)`);
console.log(`✅ Should notify for 30 min delay? ${test30} (expected: false)`);
console.log(`✅ Should notify for 15 min delay? ${test15} (expected: false)`);

// Test 2: Route delay calculation (PDF Step 1)
console.log('\n📝 Test 2: Route delay calculation (PDF Step 1)');
const coords = Coordinates.create({ lat: 40.7128, lng: -74.006 });

const route = Route.create({
  originAddress: '123 Main St, New York',
  originCoords: coords,
  destinationAddress: '456 Oak Ave, Brooklyn',
  destinationCoords: coords,
  distanceMeters: 15000,
  normalDurationSeconds: 1800, // 30 minutes
}, 'r1');

console.log('Created route:', route.getSummary());
console.log('Normal duration:', Math.round(route.normalDurationSeconds / 60), 'minutes');

// Update with traffic data
route.updateTrafficData(2400, 'heavy'); // 40 minutes
const delayMinutes = route.calculateDelayMinutes();

console.log('Current duration with traffic:', Math.round(route.currentDurationSeconds! / 60), 'minutes');
console.log(`✅ Calculated delay: ${delayMinutes} minutes (expected: 10)`);

// Test 3: DeliveryStatus transitions
console.log('\n📝 Test 3: DeliveryStatus state transitions');
const statusPending = DeliveryStatus.pending();
const statusInTransit = DeliveryStatus.inTransit();
const statusDelayed = DeliveryStatus.delayed();

console.log(`Can pending be delayed? ${statusPending.canBeDelayed()} (expected: true)`);
console.log(`Can in_transit be delayed? ${statusInTransit.canBeDelayed()} (expected: true)`);
console.log(`Is delayed status delayed? ${statusDelayed.isDelayed()} (expected: true)`);

// Test 4: Coordinates validation
console.log('\n📝 Test 4: Coordinates validation');
try {
  const validCoords = Coordinates.create({ lat: 40.7128, lng: -74.006 });
  console.log(`✅ Valid coordinates accepted: (${validCoords.lat}, ${validCoords.lng})`);
  console.log(`   PostgreSQL POINT format: ${validCoords.toPoint()}`);
} catch (e: any) {
  console.log('❌ Failed:', e.message);
}

try {
  Coordinates.create({ lat: 91, lng: 0 }); // Should fail
  console.log('❌ Invalid latitude accepted (should have failed!)');
} catch (e: any) {
  console.log(`✅ Invalid latitude rejected: ${e.message}`);
}

console.log('\n' + '═'.repeat(60));
console.log('\n✅ All domain entity tests complete!');