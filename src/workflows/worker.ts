/**
 * Temporal Worker Entry Point
 * This runs the worker process that executes workflows and activities
 */

import { config } from "dotenv";
import { logger } from "../core/base/utils/Logger";
import { startWorker } from "../infrastructure/temporal/TemporalWorker";

// Load environment variables from .env.local
config({ path: ".env.local" });

async function main() {
  logger.info("========================================");
  logger.info("  Freight Delay Notification Worker");
  logger.info("========================================");
  logger.info("");

  // Debug: Check if API keys are loaded
  logger.info("🔑 API Keys Status:");
  logger.info(
    `   OpenAI: ${process.env.OPENAI_API_KEY ? "✅ Configured" : "❌ Not configured"}`,
  );
  logger.info(
    `   SendGrid: ${process.env.SENDGRID_API_KEY ? "✅ Configured" : "❌ Not configured"}`,
  );
  logger.info(
    `   Twilio: ${process.env.TWILIO_ACCOUNT_SID ? "✅ Configured" : "❌ Not configured"}`,
  );
  logger.info(
    `   Google Maps: ${process.env.GOOGLE_MAPS_API_KEY ? "✅ Configured" : "❌ Not configured"}`,
  );
  logger.info(
    `   Mapbox: ${process.env.MAPBOX_ACCESS_TOKEN ? "✅ Configured" : "❌ Not configured"}`,
  );
  logger.info("");

  try {
    // Start the worker
    await startWorker();
  } catch (error) {
    logger.error("Failed to start worker:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  logger.info("\n👋 Received shutdown signal...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("\n👋 Received shutdown signal...");
  process.exit(0);
});

// Start the worker
main().catch((err) => {
  logger.error("Unhandled error in worker:", err);
  process.exit(1);
});
