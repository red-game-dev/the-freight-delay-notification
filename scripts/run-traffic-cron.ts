/**
 * Local Traffic Monitoring Cron Runner
 * Runs the traffic check endpoint at configurable intervals for local development
 *
 * Usage:
 *   npm run cron:dev    # Uses CRON_INTERVAL_SECONDS from .env.local (default: 10s for testing)
 *   npm run cron:prod   # Uses 600s (10 minutes) regardless of env var
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

const CRON_SECRET = process.env.CRON_SECRET || "dev-secret-key";
const CRON_INTERVAL_SECONDS = parseInt(
  process.env.CRON_INTERVAL_SECONDS || "10",
  10,
);
const API_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ENDPOINT = `${API_URL}/api/cron/check-traffic`;

// Check if production mode
const isProd = process.argv.includes("--prod");
const intervalSeconds = isProd ? 600 : CRON_INTERVAL_SECONDS;

console.log("🚦 Traffic Monitoring Cron Runner");
console.log("================================");
console.log(`📍 Endpoint: ${ENDPOINT}`);
console.log(
  `⏱️  Interval: ${intervalSeconds} seconds (${intervalSeconds / 60} minutes)`,
);
console.log(`🔐 Secret: ${CRON_SECRET.substring(0, 8)}...`);
console.log(`🌍 Mode: ${isProd ? "Production" : "Development"}`);
console.log("================================\n");

let runCount = 0;
let successCount = 0;
let errorCount = 0;

async function runTrafficCheck() {
  runCount++;
  const startTime = Date.now();

  console.log(
    `\n[${new Date().toISOString()}] 🔄 Run #${runCount} - Starting traffic check...`,
  );

  try {
    const response = await fetch(ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // API returns { success: true, data: { success: true, result: {...} } }
    const apiResult = data.data || data;

    if (data.success && apiResult.result) {
      successCount++;
      console.log(
        `✅ Run #${runCount} completed successfully in ${duration}ms`,
      );
      console.log(`📊 Results:`, {
        routesChecked: apiResult.result.routesChecked,
        snapshotsSaved: apiResult.result.snapshotsSaved,
        delaysDetected: apiResult.result.delaysDetected,
        notificationsTriggered: apiResult.result.notificationsTriggered,
        errors: apiResult.result.errors?.length || 0,
      });

      if (apiResult.result.errors && apiResult.result.errors.length > 0) {
        console.log(`⚠️  Errors encountered:`, apiResult.result.errors);
      }
    } else {
      throw new Error(data.error?.message || data.error || "Unknown error");
    }
  } catch (error: any) {
    errorCount++;
    const duration = Date.now() - startTime;
    console.error(
      `❌ Run #${runCount} failed after ${duration}ms:`,
      error.message,
    );

    if (error.cause) {
      console.error("   Cause:", error.cause);
    }
  }

  // Print statistics
  console.log(
    `📈 Stats: ${successCount} success, ${errorCount} errors, ${runCount} total`,
  );
}

// Initial run
console.log("🚀 Starting initial traffic check...");
runTrafficCheck();

// Schedule recurring runs
const intervalMs = intervalSeconds * 1000;
console.log(`⏰ Scheduling checks every ${intervalSeconds} seconds...`);

const intervalId = setInterval(() => {
  runTrafficCheck();
}, intervalMs);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down cron runner...");
  clearInterval(intervalId);
  console.log(`📊 Final Stats:`);
  console.log(`   Total Runs: ${runCount}`);
  console.log(
    `   Successful: ${successCount} (${((successCount / runCount) * 100).toFixed(1)}%)`,
  );
  console.log(
    `   Failed: ${errorCount} (${((errorCount / runCount) * 100).toFixed(1)}%)`,
  );
  console.log("👋 Goodbye!\n");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n🛑 Received SIGTERM, shutting down...");
  clearInterval(intervalId);
  process.exit(0);
});

// Keep the process running
console.log("✨ Cron runner is active. Press Ctrl+C to stop.\n");
