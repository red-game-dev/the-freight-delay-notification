/**
 * Database Seeding Script
 * Populates database with test data for development
 */

import { config } from 'dotenv';
import { getDatabaseService, resetDatabaseService } from '../src/infrastructure/database/index.js';

// Load environment variables
config({ path: '.env.local' });

async function seed() {
  console.log('🌱 Seeding Database');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');

  // Reset and get fresh database service
  resetDatabaseService();
  const db = getDatabaseService();

  console.log('📊 Using adapter:', db.getAdapterName());
  console.log('');

  try {
    // Get test user info from env
    const testEmail = process.env.TEST_EMAIL || 'red.pace.dev@gmail.com';
    const testPhone = process.env.TEST_PHONE || '+35679323059';
    const testName = process.env.TEST_NAME || 'Red Pace Dev';

    // 1. Create Customers
    console.log('👥 Creating customers...');

    const customer1Result = await db.createCustomer({
      email: testEmail,
      phone: testPhone,
      name: testName,
      notification_preferences: {
        primary: 'email',
        secondary: 'sms',
      },
    });

    if (!customer1Result.success) {
      console.error('   ❌ Failed to create customer 1:', customer1Result.error.message);
      // Continue anyway
    } else {
      console.log(`   ✅ Created customer: ${testName} (${testEmail})`);
    }

    const customer2Result = await db.createCustomer({
      email: 'jane.smith@example.com',
      phone: '+1234567891',
      name: 'Jane Smith',
      notification_preferences: {
        primary: 'sms',
        secondary: 'email',
      },
    });

    if (!customer2Result.success) {
      console.error('   ❌ Failed to create customer 2:', customer2Result.error.message);
    } else {
      console.log('   ✅ Created customer: Jane Smith');
    }

    // 2. Create Routes
    console.log('');
    console.log('🗺️  Creating routes...');

    const route1Result = await db.createRoute({
      origin_address: 'Times Square, Manhattan, NY',
      origin_coords: { lat: 40.7580, lng: -73.9855 },
      destination_address: 'JFK Airport, Queens, NY',
      destination_coords: { lat: 40.6413, lng: -73.7781 },
      distance_meters: 24140,
      normal_duration_seconds: 2280, // 38 minutes
    });

    if (!route1Result.success) {
      console.error('   ❌ Failed to create route 1:', route1Result.error.message);
    } else {
      console.log('   ✅ Created route: Times Square → JFK Airport');
    }

    const route2Result = await db.createRoute({
      origin_address: 'Downtown Los Angeles, CA',
      origin_coords: { lat: 34.0522, lng: -118.2437 },
      destination_address: 'Santa Monica, CA',
      destination_coords: { lat: 34.0195, lng: -118.4912 },
      distance_meters: 23000,
      normal_duration_seconds: 2100, // 35 minutes
    });

    if (!route2Result.success) {
      console.error('   ❌ Failed to create route 2:', route2Result.error.message);
    } else {
      console.log('   ✅ Created route: Downtown LA → Santa Monica');
    }

    // 3. Create Deliveries
    console.log('');
    console.log('📦 Creating deliveries...');

    const customerId = customer1Result.success ? customer1Result.value.id : '550e8400-e29b-41d4-a716-446655440000';
    const routeId = route1Result.success ? route1Result.value.id : '660e8400-e29b-41d4-a716-446655440000';

    const delivery1Result = await db.createDelivery({
      tracking_number: 'FD-2024-001',
      customer_id: customerId,
      route_id: routeId,
      status: 'in_transit',
      scheduled_delivery: new Date(Date.now() + 3600000), // 1 hour from now
      delay_threshold_minutes: 30,
    });

    if (!delivery1Result.success) {
      console.error('   ❌ Failed to create delivery 1:', delivery1Result.error.message);
    } else {
      console.log('   ✅ Created delivery: FD-2024-001 (in_transit)');
    }

    const delivery2Result = await db.createDelivery({
      tracking_number: 'FD-2024-002',
      customer_id: customerId,
      route_id: routeId,
      status: 'pending',
      scheduled_delivery: new Date(Date.now() + 7200000), // 2 hours from now
      delay_threshold_minutes: 30,
    });

    if (!delivery2Result.success) {
      console.error('   ❌ Failed to create delivery 2:', delivery2Result.error.message);
    } else {
      console.log('   ✅ Created delivery: FD-2024-002 (pending)');
    }

    const delivery3Result = await db.createDelivery({
      tracking_number: 'FD-2024-003',
      customer_id: customerId,
      route_id: routeId,
      status: 'delayed',
      scheduled_delivery: new Date(Date.now() - 1800000), // 30 minutes ago
      delay_threshold_minutes: 30,
    });

    if (!delivery3Result.success) {
      console.error('   ❌ Failed to create delivery 3:', delivery3Result.error.message);
    } else {
      console.log('   ✅ Created delivery: FD-2024-003 (delayed)');
    }

    // 4. Verify seeding
    console.log('');
    console.log('🔍 Verifying seeded data...');

    const customersResult = await db.listCustomers(10);
    const routesResult = await db.listRoutes(10);
    const deliveriesResult = await db.listDeliveries(10);

    console.log(`   Customers: ${customersResult.success ? customersResult.value.length : 0}`);
    console.log(`   Routes: ${routesResult.success ? routesResult.value.length : 0}`);
    console.log(`   Deliveries: ${deliveriesResult.success ? deliveriesResult.value.length : 0}`);

    console.log('');
    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ Database seeding completed!');
    console.log('');
    console.log('🧪 Test with: npm run test:database');
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('❌ Seeding failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

seed();
