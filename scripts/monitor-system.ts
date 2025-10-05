/**
 * Real-time System Monitor
 * Continuously monitors traffic snapshots, notifications, and workflows
 */

import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { InfrastructureError } from "@/core/base/errors/BaseError";
import { logger } from "@/core/base/utils/Logger";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new InfrastructureError("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);

let lastSnapshotId: string | null = null;
let lastNotificationId: string | null = null;
let lastWorkflowId: string | null = null;

async function checkForUpdates() {
  const timestamp = new Date().toISOString();

  // Check for new traffic snapshots
  const { data: snapshots } = await supabase
    .from("traffic_snapshots")
    .select("*")
    .order("snapshot_at", { ascending: false })
    .limit(1);

  if (snapshots && snapshots.length > 0) {
    const latest = snapshots[0];
    if (latest.id !== lastSnapshotId) {
      lastSnapshotId = latest.id;
      const route = await supabase
        .from("routes")
        .select("origin_address, destination_address")
        .eq("id", latest.route_id)
        .single();

      logger.info(`\n[${timestamp}] 🚦 NEW TRAFFIC SNAPSHOT`);
      logger.info(
        `   Route: ${route.data?.origin_address?.substring(0, 30)}... → ${route.data?.destination_address?.substring(0, 30)}...`,
      );
      logger.info(
        `   Condition: ${latest.traffic_condition} | Delay: ${latest.delay_minutes} min | Severity: ${latest.severity || "N/A"}`,
      );
      if (latest.description) {
        logger.info(`   Description: ${latest.description}`);
      }
    }
  }

  // Check for new notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (notifications && notifications.length > 0) {
    const latest = notifications[0];
    if (latest.id !== lastNotificationId) {
      lastNotificationId = latest.id;
      const delivery = await supabase
        .from("deliveries")
        .select("tracking_number")
        .eq("id", latest.delivery_id)
        .single();

      logger.info(`\n[${timestamp}] 📧 NEW NOTIFICATION`);
      logger.info(
        `   Tracking: ${delivery.data?.tracking_number || "Unknown"}`,
      );
      logger.info(`   Status: ${latest.status} | Channel: ${latest.channel}`);
      logger.info(`   Recipient: ${latest.recipient}`);
      if (latest.delay_minutes) {
        logger.info(`   Delay: ${latest.delay_minutes} minutes`);
      }
      if (
        "retry_count" in latest &&
        typeof latest.retry_count === "number" &&
        latest.retry_count > 0
      ) {
        logger.info(`   Retries: ${latest.retry_count}`);
      }
    }
  }

  // Check for new workflow executions
  const { data: workflows } = await supabase
    .from("workflow_executions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(1);

  if (workflows && workflows.length > 0) {
    const latest = workflows[0];
    if (latest.id !== lastWorkflowId) {
      lastWorkflowId = latest.id;

      logger.info(`\n[${timestamp}] ⚙️  NEW WORKFLOW EXECUTION`);
      logger.info(`   Workflow ID: ${latest.workflow_id}`);
      logger.info(`   Run ID: ${latest.run_id}`);
      logger.info(`   Status: ${latest.status}`);
      if (latest.error_message) {
        logger.info(`   Error: ${latest.error_message}`);
      }
    }
  }
}

async function showStats() {
  const { count: snapshotsCount } = await supabase
    .from("traffic_snapshots")
    .select("*", { count: "exact", head: true });

  const { count: notificationsCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true });

  const { count: workflowsCount } = await supabase
    .from("workflow_executions")
    .select("*", { count: "exact", head: true });

  const { count: activeDeliveriesCount } = await supabase
    .from("deliveries")
    .select("*", { count: "exact", head: true })
    .in("status", ["in_transit", "delayed"]);

  console.clear();
  logger.info("╔════════════════════════════════════════════════════════════╗");
  logger.info("║        🌍 TRAFFIC MONITORING SYSTEM - LIVE MONITOR        ║");
  logger.info("╚════════════════════════════════════════════════════════════╝");
  logger.info("");
  logger.info(`📊 Current Stats (as of ${new Date().toLocaleTimeString()})`);
  logger.info("────────────────────────────────────────────────────────────");
  logger.info(`   Traffic Snapshots: ${snapshotsCount || 0}`);
  logger.info(`   Notifications: ${notificationsCount || 0}`);
  logger.info(`   Workflow Executions: ${workflowsCount || 0}`);
  logger.info(`   Active Deliveries: ${activeDeliveriesCount || 0}`);
  logger.info("────────────────────────────────────────────────────────────");
  logger.info("");
  logger.info("👀 Monitoring for new events... (Press Ctrl+C to stop)");
  logger.info("");
}

async function startMonitoring() {
  logger.info("🚀 Starting real-time system monitor...\n");

  // Initial stats
  await showStats();

  // Check for updates every 2 seconds
  setInterval(checkForUpdates, 2000);

  // Refresh stats every 30 seconds
  setInterval(showStats, 30000);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("\n\n🛑 Stopping monitor...");
  logger.info("👋 Goodbye!\n");
  process.exit(0);
});

// Start monitoring
startMonitoring().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
