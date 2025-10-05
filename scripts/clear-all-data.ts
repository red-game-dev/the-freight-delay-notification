/**
 * Clear All Data from Remote Database
 * Deletes all data while preserving schema and default threshold
 */

import * as readline from "node:readline";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { logger } from "@/core/base/utils/Logger";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function askConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "Are you sure you want to DELETE ALL DATA? (yes/no): ",
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === "yes");
      },
    );
  });
}

async function getTableCounts() {
  logger.info("📊 Current Data:");
  logger.info("");

  const tables = [
    "workflow_executions",
    "traffic_snapshots",
    "notifications",
    "deliveries",
    "routes",
    "customers",
    "thresholds",
  ];

  const counts: Record<string, number> = {};

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (!error && count !== null) {
      counts[table] = count;
      logger.info(
        `   ${table.padEnd(25)} ${count.toString().padStart(5)} rows`,
      );
    }
  }

  logger.info("");
  return counts;
}

async function clearTable(
  tableName: string,
  keepDefault = false,
): Promise<number> {
  let deleted = 0;

  if (keepDefault && tableName === "thresholds") {
    // Keep default threshold, delete others
    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .eq("is_default", false)
      .select();

    if (!error && data) {
      deleted = data.length;
    }
  } else {
    // Delete all rows
    const { count, error } = await supabase
      .from(tableName)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (!error && count !== null) {
      deleted = count;
    }
  }

  return deleted;
}

async function clearAllData() {
  logger.info("🗑️  Clear All Database Data");
  logger.info("════════════════════════════════════════════════════════════");
  logger.info("");
  logger.info(`📡 Database: ${supabaseUrl}`);
  logger.info("");

  // Show current counts
  const beforeCounts = await getTableCounts();
  const totalRows = Object.values(beforeCounts).reduce((a, b) => a + b, 0);

  if (totalRows === 0) {
    logger.info("✅ Database is already empty!");
    logger.info("");
    return;
  }

  logger.warn("⚠️  WARNING: This will delete ALL data from all tables!");
  logger.info("   Schema and default threshold will be preserved.");
  logger.info("");

  const confirmed = await askConfirmation();

  if (!confirmed) {
    logger.info("");
    logger.info("❌ Cancelled. No data was deleted.");
    logger.info("");
    process.exit(0);
  }

  logger.info("");
  logger.info("🗑️  Deleting data (in dependency order)...");
  logger.info("");

  // Delete in reverse dependency order
  const deletionOrder = [
    { table: "workflow_executions", keepDefault: false },
    { table: "traffic_snapshots", keepDefault: false },
    { table: "notifications", keepDefault: false },
    { table: "deliveries", keepDefault: false },
    { table: "routes", keepDefault: false },
    { table: "customers", keepDefault: false },
    { table: "thresholds", keepDefault: true }, // Keep default
  ];

  let totalDeleted = 0;

  for (const { table, keepDefault } of deletionOrder) {
    try {
      const deleted = await clearTable(table, keepDefault);
      totalDeleted += deleted;

      if (keepDefault && table === "thresholds") {
        logger.info(
          `   ✅ ${table.padEnd(25)} ${deleted.toString().padStart(5)} deleted (kept default)`,
        );
      } else {
        logger.info(
          `   ✅ ${table.padEnd(25)} ${deleted.toString().padStart(5)} deleted`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`   ❌ ${table.padEnd(25)} Failed: ${message}`);
    }
  }

  logger.info("");
  logger.info("════════════════════════════════════════════════════════════");
  logger.info("");

  // Verify deletion
  const afterCounts = await getTableCounts();
  const remainingRows = Object.values(afterCounts).reduce((a, b) => a + b, 0);

  logger.info("✅ Data cleared successfully!");
  logger.info("");
  logger.info(`   Total deleted: ${totalDeleted} rows`);
  logger.info(`   Remaining:     ${remainingRows} rows (default threshold)`);
  logger.info("");
  logger.info("💡 To re-seed data:");
  logger.info("   Dashboard → SQL Editor → Run supabase/seed.sql");
  logger.info("");
}

async function main() {
  try {
    await clearAllData();
  } catch (error) {
    logger.error("");
    const message = error instanceof Error ? error.message : String(error);
    logger.error("❌ Failed to clear data:", message);
    logger.error("");
    logger.error("💡 Alternative: Run in Dashboard SQL Editor:");
    logger.error("   scripts/clear-data.sql");
    logger.error("");
    process.exit(1);
  }
}

main();
