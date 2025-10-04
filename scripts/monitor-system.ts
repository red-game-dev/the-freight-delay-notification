/**
 * Real-time System Monitor
 * Continuously monitors traffic snapshots, notifications, and workflows
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

let lastSnapshotId: string | null = null;
let lastNotificationId: string | null = null;
let lastWorkflowId: string | null = null;

async function checkForUpdates() {
  const timestamp = new Date().toISOString();

  // Check for new traffic snapshots
  const { data: snapshots } = await supabase
    .from('traffic_snapshots')
    .select('*')
    .order('snapshot_at', { ascending: false })
    .limit(1);

  if (snapshots && snapshots.length > 0) {
    const latest = snapshots[0];
    if (latest.id !== lastSnapshotId) {
      lastSnapshotId = latest.id;
      const route = await supabase
        .from('routes')
        .select('origin_address, destination_address')
        .eq('id', latest.route_id)
        .single();

      console.log(`\n[${timestamp}] 🚦 NEW TRAFFIC SNAPSHOT`);
      console.log(`   Route: ${route.data?.origin_address?.substring(0, 30)}... → ${route.data?.destination_address?.substring(0, 30)}...`);
      console.log(`   Condition: ${latest.traffic_condition} | Delay: ${latest.delay_minutes} min | Severity: ${latest.severity || 'N/A'}`);
      if (latest.description) {
        console.log(`   Description: ${latest.description}`);
      }
    }
  }

  // Check for new notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (notifications && notifications.length > 0) {
    const latest = notifications[0];
    if (latest.id !== lastNotificationId) {
      lastNotificationId = latest.id;
      const delivery = await supabase
        .from('deliveries')
        .select('tracking_number')
        .eq('id', latest.delivery_id)
        .single();

      console.log(`\n[${timestamp}] 📧 NEW NOTIFICATION`);
      console.log(`   Tracking: ${delivery.data?.tracking_number || 'Unknown'}`);
      console.log(`   Status: ${latest.status} | Channel: ${latest.channel}`);
      console.log(`   Recipient: ${latest.recipient}`);
      if (latest.delay_minutes) {
        console.log(`   Delay: ${latest.delay_minutes} minutes`);
      }
      if ((latest as any).retry_count > 0) {
        console.log(`   Retries: ${(latest as any).retry_count}`);
      }
    }
  }

  // Check for new workflow executions
  const { data: workflows } = await supabase
    .from('workflow_executions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1);

  if (workflows && workflows.length > 0) {
    const latest = workflows[0];
    if (latest.id !== lastWorkflowId) {
      lastWorkflowId = latest.id;

      console.log(`\n[${timestamp}] ⚙️  NEW WORKFLOW EXECUTION`);
      console.log(`   Workflow ID: ${latest.workflow_id}`);
      console.log(`   Run ID: ${latest.run_id}`);
      console.log(`   Status: ${latest.status}`);
      if (latest.error_message) {
        console.log(`   Error: ${latest.error_message}`);
      }
    }
  }
}

async function showStats() {
  const { count: snapshotsCount } = await supabase
    .from('traffic_snapshots')
    .select('*', { count: 'exact', head: true });

  const { count: notificationsCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true });

  const { count: workflowsCount } = await supabase
    .from('workflow_executions')
    .select('*', { count: 'exact', head: true });

  const { count: activeDeliveriesCount } = await supabase
    .from('deliveries')
    .select('*', { count: 'exact', head: true })
    .in('status', ['in_transit', 'delayed']);

  console.clear();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        🌍 TRAFFIC MONITORING SYSTEM - LIVE MONITOR        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📊 Current Stats (as of ${new Date().toLocaleTimeString()})`);
  console.log('────────────────────────────────────────────────────────────');
  console.log(`   Traffic Snapshots: ${snapshotsCount || 0}`);
  console.log(`   Notifications: ${notificationsCount || 0}`);
  console.log(`   Workflow Executions: ${workflowsCount || 0}`);
  console.log(`   Active Deliveries: ${activeDeliveriesCount || 0}`);
  console.log('────────────────────────────────────────────────────────────');
  console.log('');
  console.log('👀 Monitoring for new events... (Press Ctrl+C to stop)');
  console.log('');
}

async function startMonitoring() {
  console.log('🚀 Starting real-time system monitor...\n');

  // Initial stats
  await showStats();

  // Check for updates every 2 seconds
  setInterval(checkForUpdates, 2000);

  // Refresh stats every 30 seconds
  setInterval(showStats, 30000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping monitor...');
  console.log('👋 Goodbye!\n');
  process.exit(0);
});

// Start monitoring
startMonitoring().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
