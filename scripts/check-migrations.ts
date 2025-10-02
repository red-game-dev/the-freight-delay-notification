/**
 * Check if migrations actually ran by verifying key columns exist
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

async function checkMigrations() {
  console.log('🔍 Checking if migrations ran...');
  console.log('');

  let allPassed = true;

  // Check 1: recipient column in notifications (migration 20240101000004)
  console.log('📋 Checking migration 20240101000004_add_notification_fields.sql...');
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('recipient')
      .limit(1);

    if (error && error.message.includes('column')) {
      console.log('   ❌ Column "recipient" does NOT exist in notifications table');
      console.log('   ⚠️  Migration 20240101000004 did NOT run!');
      allPassed = false;
    } else {
      console.log('   ✅ Column "recipient" exists in notifications table');
    }
  } catch (err: any) {
    console.log('   ❌ Error checking recipient column:', err.message);
    allPassed = false;
  }

  // Check 2: steps column in workflow_executions (migration 20240101000006)
  console.log('');
  console.log('📋 Checking migration 20240101000006_add_workflow_steps.sql...');
  try {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('steps')
      .limit(1);

    if (error && error.message.includes('column')) {
      console.log('   ❌ Column "steps" does NOT exist in workflow_executions table');
      console.log('   ⚠️  Migration 20240101000006 did NOT run!');
      allPassed = false;
    } else {
      console.log('   ✅ Column "steps" exists in workflow_executions table');
    }
  } catch (err: any) {
    console.log('   ❌ Error checking steps column:', err.message);
    allPassed = false;
  }

  // Check data counts
  console.log('');
  console.log('📊 Checking data counts...');
  console.log('');

  const tables = ['customers', 'routes', 'deliveries', 'notifications', 'workflow_executions', 'traffic_snapshots', 'thresholds'];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ❌ ${table}: Error - ${error.message}`);
    } else {
      const icon = count === 0 ? '⚠️ ' : '✅';
      console.log(`   ${icon} ${table}: ${count} rows`);
    }
  }

  console.log('');
  console.log('════════════════════════════════════════════════════════════');

  if (!allPassed) {
    console.log('');
    console.log('❌ MIGRATIONS DID NOT RUN!');
    console.log('');
    console.log('💡 Solution:');
    console.log('   1. Run migrations:');
    console.log('      pnpm db:migrate');
    console.log('');
    console.log('   2. Then seed data:');
    console.log('      Dashboard → SQL Editor → Run supabase/seed.sql');
    console.log('');
    process.exit(1);
  } else {
    console.log('');
    console.log('✅ All migrations verified!');
    console.log('');

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true });

    if (count === 0) {
      console.log('⚠️  But notifications table is empty - seed may have failed');
      console.log('');
      console.log('💡 Try clearing and re-seeding:');
      console.log('   pnpm db:clear');
      console.log('   Then run seed.sql in Dashboard SQL Editor');
      console.log('');
    }
  }
}

checkMigrations().catch(console.error);
