/**
 * Local Traffic Monitoring Cron Runner
 * Runs the traffic check endpoint at configurable intervals for local development
 *
 * Usage:
 *   npm run cron:dev    # Uses CRON_INTERVAL_SECONDS from .env.local (default: 10s for testing)
 *   npm run cron:prod   # Uses 600s (10 minutes) regardless of env var
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import { InfrastructureError } from "@/core/base/errors/BaseError";
import { logger } from "@/core/base/utils/Logger";

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

logger.info("🚦 Traffic Monitoring Cron Runner");
logger.info("================================");
logger.info(`📍 Endpoint: ${ENDPOINT}`);
logger.info(
  `⏱️  Interval: ${intervalSeconds} seconds (${intervalSeconds / 60} minutes)`,
);
logger.info(`🔐 Secret: ${CRON_SECRET.substring(0, 8)}...`);
logger.info(`🌍 Mode: ${isProd ? "Production" : "Development"}`);
logger.info("================================\n");

let runCount = 0;
let successCount = 0;
let errorCount = 0;

async function runTrafficCheck() {
  runCount++;
  const startTime = Date.now();

  logger.info(
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
      throw new InfrastructureError(
        `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();

    // API returns { success: true, data: { success: true, result: {...} } }
    const apiResult = data.data || data;

    if (data.success && apiResult.result) {
      successCount++;
      logger.info(
        `✅ Run #${runCount} completed successfully in ${duration}ms`,
      );
      logger.info(`📊 Results:`, {
        routesChecked: apiResult.result.routesChecked,
        snapshotsSaved: apiResult.result.snapshotsSaved,
        delaysDetected: apiResult.result.delaysDetected,
        notificationsTriggered: apiResult.result.notificationsTriggered,
        errors: apiResult.result.errors?.length || 0,
      });

      if (apiResult.result.errors && apiResult.result.errors.length > 0) {
        logger.warn(`⚠️  Errors encountered:`, apiResult.result.errors);
      }
    } else {
      throw new InfrastructureError(
        data.error?.message || data.error || "Unknown error",
      );
    }
  } catch (error) {
    errorCount++;
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Run #${runCount} failed after ${duration}ms:`, message);

    if (error instanceof Error && error.cause) {
      logger.error("   Cause:", error.cause);
    }
  }

  // Print statistics
  logger.info(
    `📈 Stats: ${successCount} success, ${errorCount} errors, ${runCount} total`,
  );
}

// Initial run
logger.info("🚀 Starting initial traffic check...");
runTrafficCheck();

// Schedule recurring runs
const intervalMs = intervalSeconds * 1000;
logger.info(`⏰ Scheduling checks every ${intervalSeconds} seconds...`);

const intervalId = setInterval(() => {
  runTrafficCheck();
}, intervalMs);

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("\n\n🛑 Shutting down cron runner...");
  clearInterval(intervalId);
  logger.info(`📊 Final Stats:`);
  logger.info(`   Total Runs: ${runCount}`);
  logger.info(
    `   Successful: ${successCount} (${((successCount / runCount) * 100).toFixed(1)}%)`,
  );
  logger.info(
    `   Failed: ${errorCount} (${((errorCount / runCount) * 100).toFixed(1)}%)`,
  );
  logger.info("👋 Goodbye!\n");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("\n\n🛑 Received SIGTERM, shutting down...");
  clearInterval(intervalId);
  process.exit(0);
});

// Keep the process running
logger.info("✨ Cron runner is active. Press Ctrl+C to stop.\n");
