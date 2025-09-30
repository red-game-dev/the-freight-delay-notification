/**
 * Check Supabase Key Configuration
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔑 Supabase Key Check');
console.log('════════════════════════════════════════════════════════════');
console.log('');

console.log('ANON KEY:');
console.log(`  Length: ${anonKey?.length || 0} characters`);
console.log(`  First 20 chars: ${anonKey?.substring(0, 20)}...`);
console.log(`  Last 20 chars: ...${anonKey?.substring(anonKey.length - 20)}`);
console.log('');

console.log('SERVICE ROLE KEY:');
console.log(`  Length: ${serviceKey?.length || 0} characters`);
console.log(`  First 20 chars: ${serviceKey?.substring(0, 20)}...`);
console.log(`  Last 20 chars: ...${serviceKey?.substring(serviceKey.length - 20)}`);
console.log('');

if (anonKey === serviceKey) {
  console.log('❌ ERROR: ANON KEY and SERVICE ROLE KEY are IDENTICAL!');
  console.log('');
  console.log('This means you are NOT using the service role key.');
  console.log('The service role key should be DIFFERENT and LONGER.');
  console.log('');
  console.log('📝 How to fix:');
  console.log('  1. Go to: https://supabase.com/dashboard/project/cmgdicazwcsutioiuwzt/settings/api');
  console.log('  2. Look for TWO different keys:');
  console.log('     - anon / public (client-side)');
  console.log('     - service_role / secret (server-side) ← You need THIS one!');
  console.log('  3. Click the eye icon 👁️ next to "service_role"');
  console.log('  4. Copy that key (NOT the anon key!)');
  console.log('  5. Update SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.log('');
} else {
  console.log('✅ Keys are different (correct)');
  console.log('');
  console.log('Checking if service role key looks valid...');

  // Decode JWT to check role
  if (serviceKey) {
    try {
      const parts = serviceKey.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log(`  Role in JWT: ${payload.role || 'unknown'}`);

        if (payload.role === 'service_role') {
          console.log('  ✅ Correct! This is a service_role key');
        } else if (payload.role === 'anon') {
          console.log('  ❌ ERROR: This is an anon key, not a service_role key!');
        } else {
          console.log(`  ⚠️  Unknown role: ${payload.role}`);
        }
      }
    } catch (e) {
      console.log('  ⚠️  Could not decode JWT');
    }
  }
}

console.log('');
console.log('════════════════════════════════════════════════════════════');
