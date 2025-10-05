/**
 * Database Migration Script
 * Links to Supabase and runs migrations
 */

import { execSync } from "node:child_process";
import { config } from "dotenv";
import { logger } from "@/core/base/utils/Logger";

// Load environment variables
config({ path: ".env.local" });

logger.info("🗄️  Database Migration Script");
logger.info("════════════════════════════════════════════════════════════");
logger.info("");

// Extract project ref from SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  logger.error("❌ Error: SUPABASE_URL not found in .env.local");
  logger.error("   Make sure SUPABASE_URL is set in .env.local");
  process.exit(1);
}

const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!match) {
  logger.error("❌ Error: Invalid SUPABASE_URL format");
  logger.error("   Expected: https://your-project.supabase.co");
  process.exit(1);
}

const projectRef = match[1];

logger.info("📋 Configuration:");
logger.info(`   Project Ref: ${projectRef}`);
logger.info(`   Supabase URL: ${supabaseUrl}`);
logger.info("");

// Check if already linked
const fs = require("node:fs");
const isLinked = fs.existsSync(".supabase/config.toml");

if (!isLinked) {
  logger.info("🔗 Linking to Supabase project...");
  logger.info("");

  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (!dbPassword) {
    logger.warn("⚠️  You will be prompted for your database password");
    logger.info(
      `   Get it from: https://supabase.com/dashboard/project/${projectRef}/settings/database`,
    );
    logger.info("");
    logger.info(
      "   💡 Tip: Add SUPABASE_DB_PASSWORD to .env.local to avoid this prompt",
    );
    logger.info("");
  }

  try {
    const linkCommand = dbPassword
      ? `npx supabase link --project-ref ${projectRef} --password ${dbPassword}`
      : `npx supabase link --project-ref ${projectRef}`;

    execSync(linkCommand, { stdio: "inherit" });
    logger.info("");
    logger.info("✅ Successfully linked to Supabase project");
  } catch (_error) {
    logger.error("");
    logger.error("❌ Failed to link to Supabase project");
    process.exit(1);
  }
} else {
  logger.info("✅ Already linked to Supabase project");
}

logger.info("");
logger.info("🚀 Pushing migrations to remote database...");
logger.info("");

try {
  execSync("npx supabase db push", { stdio: "inherit" });

  logger.info("");
  logger.info("════════════════════════════════════════════════════════════");
  logger.info("✅ Database migrations completed successfully!");
  logger.info("");
  logger.info("📊 View your database:");
  logger.info(`   https://supabase.com/dashboard/project/${projectRef}/editor`);
  logger.info("");
} catch (_error) {
  logger.error("");
  logger.error("❌ Failed to push migrations");
  logger.error("");
  logger.error("Troubleshooting:");
  logger.error("  1. Check your database password is correct");
  logger.error("  2. Verify SUPABASE_URL in .env.local");
  logger.error("  3. Check migrations in supabase/migrations/");
  logger.error("");
  process.exit(1);
}
