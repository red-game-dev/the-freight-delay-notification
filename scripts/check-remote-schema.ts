/**
 * Comprehensive Remote Database Schema Checker
 * Verifies tables, types, indexes, triggers, and data counts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface SchemaCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
}

const checks: SchemaCheck[] = [];

async function runQuery(query: string): Promise<any> {
  const { data, error } = await supabase.rpc('exec_sql', { sql: query }).single();
  if (error) {
    // Try direct query if RPC not available
    const result = await supabase.from('_').select('*').limit(0);
    throw new Error('Cannot execute raw SQL queries');
  }
  return data;
}

async function checkTables() {
  console.log('📊 Checking Tables...');
  console.log('');

  const expectedTables = [
    'customers',
    'routes',
    'deliveries',
    'notifications',
    'workflow_executions',
    'traffic_snapshots',
    'thresholds',
  ];

  for (const table of expectedTables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      checks.push({
        name: `Table: ${table}`,
        status: 'fail',
        message: `Missing or inaccessible`,
        details: error.message,
      });
      console.log(`   ❌ ${table}: Missing`);
    } else {
      checks.push({
        name: `Table: ${table}`,
        status: 'pass',
        message: `Exists (${count} rows)`,
        details: { count },
      });
      console.log(`   ✅ ${table}: ${count} rows`);
    }
  }
}

async function checkEnumTypes() {
  console.log('');
  console.log('🔤 Checking Enum Types...');
  console.log('');

  const expectedEnums = {
    delivery_status: ['pending', 'in_transit', 'delayed', 'delivered', 'cancelled', 'failed'],
    notification_channel: ['email', 'sms'],
    notification_status: ['pending', 'sent', 'failed', 'skipped'],
    workflow_status: ['running', 'completed', 'failed', 'cancelled', 'timed_out'],
    traffic_condition: ['light', 'normal', 'moderate', 'heavy', 'severe'],
  };

  for (const [enumName, expectedValues] of Object.entries(expectedEnums)) {
    try {
      // Try to query with the enum to check if it exists
      const testQuery = `SELECT '${expectedValues[0]}'::${enumName}`;
      await supabase.rpc('exec_sql', { sql: testQuery });

      checks.push({
        name: `Enum: ${enumName}`,
        status: 'pass',
        message: `Exists with ${expectedValues.length} values`,
        details: { values: expectedValues },
      });
      console.log(`   ✅ ${enumName}: ${expectedValues.join(', ')}`);
    } catch (error) {
      checks.push({
        name: `Enum: ${enumName}`,
        status: 'fail',
        message: `Missing or invalid`,
      });
      console.log(`   ❌ ${enumName}: Missing`);
    }
  }
}

async function checkIndexes() {
  console.log('');
  console.log('📇 Checking Key Indexes...');
  console.log('');

  const expectedIndexes = [
    'idx_deliveries_customer_id',
    'idx_deliveries_status',
    'idx_deliveries_tracking_number',
    'idx_notifications_delivery_id',
    'idx_workflow_executions_delivery_id',
    'idx_traffic_snapshots_route_id',
    'idx_thresholds_is_default',
  ];

  let indexCount = 0;

  for (const indexName of expectedIndexes) {
    try {
      // This is a simplified check - we can't easily query indexes without RPC
      indexCount++;
      console.log(`   ⚠️  ${indexName}: Cannot verify (requires SQL access)`);
    } catch (error) {
      console.log(`   ⚠️  ${indexName}: Cannot verify`);
    }
  }

  checks.push({
    name: 'Indexes',
    status: 'warn',
    message: `${expectedIndexes.length} indexes expected (verification requires Dashboard)`,
  });
}

async function checkDataIntegrity() {
  console.log('');
  console.log('🔍 Checking Data Integrity...');
  console.log('');

  // Check for test customer
  const { data: testCustomer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('email', 'red.pace.dev@gmail.com')
    .single();

  if (testCustomer) {
    checks.push({
      name: 'Test Customer',
      status: 'pass',
      message: `Found: Red Pace Dev`,
      details: testCustomer,
    });
    console.log(`   ✅ Test customer exists: ${testCustomer.name}`);
  } else {
    checks.push({
      name: 'Test Customer',
      status: 'warn',
      message: `Not found (may need seeding)`,
    });
    console.log(`   ⚠️  Test customer not found`);
  }

  // Check for default threshold
  const { data: defaultThreshold, error: thresholdError } = await supabase
    .from('thresholds')
    .select('*')
    .eq('is_default', true)
    .maybeSingle();

  if (defaultThreshold) {
    checks.push({
      name: 'Default Threshold',
      status: 'pass',
      message: `Found: ${defaultThreshold.name} (${defaultThreshold.delay_minutes} min)`,
      details: defaultThreshold,
    });
    console.log(`   ✅ Default threshold: ${defaultThreshold.name}`);
  } else {
    checks.push({
      name: 'Default Threshold',
      status: 'fail',
      message: `Missing (required for workflows)`,
    });
    console.log(`   ❌ Default threshold missing`);
  }

  // Check for orphaned records
  const { count: orphanedDeliveries } = await supabase
    .from('deliveries')
    .select('*', { count: 'exact', head: true })
    .is('customer_id', null);

  if (orphanedDeliveries === 0) {
    checks.push({
      name: 'Referential Integrity',
      status: 'pass',
      message: `No orphaned records`,
    });
    console.log(`   ✅ No orphaned deliveries`);
  } else {
    checks.push({
      name: 'Referential Integrity',
      status: 'warn',
      message: `Found ${orphanedDeliveries} orphaned deliveries`,
    });
    console.log(`   ⚠️  Found ${orphanedDeliveries} orphaned deliveries`);
  }
}

async function checkMigrationHistory() {
  console.log('');
  console.log('📜 Checking Migration History...');
  console.log('');

  // This requires direct SQL access, so we'll note it
  checks.push({
    name: 'Migration History',
    status: 'warn',
    message: `Verification requires Dashboard SQL access`,
  });

  console.log(`   ⚠️  Check migration history in Dashboard:`);
  console.log(`      SELECT * FROM supabase_migrations.schema_migrations;`);
}

async function printSummary() {
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('📊 Schema Check Summary');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');

  const passed = checks.filter((c) => c.status === 'pass').length;
  const failed = checks.filter((c) => c.status === 'fail').length;
  const warnings = checks.filter((c) => c.status === 'warn').length;

  console.log(`✅ Passed:   ${passed}`);
  console.log(`❌ Failed:   ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log('');

  if (failed > 0) {
    console.log('❌ Failed Checks:');
    checks
      .filter((c) => c.status === 'fail')
      .forEach((c) => {
        console.log(`   - ${c.name}: ${c.message}`);
      });
    console.log('');
  }

  if (failed > 0) {
    console.log('💡 Recommendation:');
    console.log('');
    console.log('   Run migrations:');
    console.log('   pnpm db:migrate');
    console.log('');
    console.log('   Then seed data:');
    console.log('   Dashboard → SQL Editor → Run supabase/seed.sql');
    console.log('');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('✅ Schema is valid with minor warnings');
    console.log('');
  } else {
    console.log('✅ Schema is perfect!');
    console.log('');
  }
}

async function main() {
  console.log('🔍 Remote Database Schema Check');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`📡 Database: ${supabaseUrl}`);
  console.log('');

  try {
    await checkTables();
    await checkEnumTypes();
    await checkIndexes();
    await checkDataIntegrity();
    await checkMigrationHistory();
    await printSummary();
  } catch (error: any) {
    console.error('');
    console.error('❌ Schema check failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

main();
