/**
 * Quick test for Database Adapter
 */

import { config } from 'dotenv';
import { getDatabaseService } from '../src/infrastructure/database/index.js';

// Load .env.local
config({ path: '.env.local' });

(async () => {
  console.log('🧪 Testing Database Adapter\n');

  const db = getDatabaseService(); // Uses Mock automatically if Supabase not configured
  console.log('Adapter:', db.getAdapterName());
  console.log('');

  // Get test email and phone from .env or use defaults
  const testEmail = process.env.TEST_EMAIL || 'john.doe@example.com';
  const testPhone = process.env.TEST_PHONE || '+1234567890';

  console.log('Test Configuration:');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Phone: ${testPhone}`);

  // Test 1: Get customer by email
  console.log('\n📝 Test 1: Get customer by email');
  const customerResult = await db.getCustomerByEmail(testEmail);
  if (customerResult.success && customerResult.value) {
    console.log('✅ Found customer:', customerResult.value.name);
    console.log('   Email:', customerResult.value.email);
    console.log('   Phone:', customerResult.value.phone);
  } else {
    console.log('❌ Failed:', customerResult.success ? 'Not found' : customerResult.error.message);
  }

  // Test 2: List deliveries
  console.log('\n📝 Test 2: List deliveries');
  const deliveriesResult = await db.listDeliveries(10);
  if (deliveriesResult.success) {
    console.log(`✅ Found ${deliveriesResult.value.length} deliveries`);
    deliveriesResult.value.forEach(d => {
      console.log(`   - ${d.tracking_number}: ${d.status}`);
    });
  } else {
    console.log('❌ Failed:', deliveriesResult.error.message);
  }

  // Test 3: Get delivery by tracking number
  console.log('\n📝 Test 3: Get delivery by tracking number');
  const deliveryResult = await db.getDeliveryByTrackingNumber('FD-2024-001');
  if (deliveryResult.success && deliveryResult.value) {
    console.log('✅ Found delivery:', deliveryResult.value.tracking_number);
    console.log('   Status:', deliveryResult.value.status);
    console.log('   Scheduled:', deliveryResult.value.scheduled_delivery);
  } else {
    console.log('❌ Failed:', deliveryResult.success ? 'Not found' : deliveryResult.error.message);
  }

  console.log('\n✅ Database adapter tests complete!');
})().catch(console.error);