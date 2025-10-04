/**
 * Clear All Data from Remote Database
 * Deletes all data while preserving schema and default threshold
 */

import * as readline from "node:readline";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
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
  console.log("📊 Current Data:");
  console.log("");

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
      console.log(
        `   ${table.padEnd(25)} ${count.toString().padStart(5)} rows`,
      );
    }
  }

  console.log("");
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
  console.log("🗑️  Clear All Database Data");
  console.log("════════════════════════════════════════════════════════════");
  console.log("");
  console.log(`📡 Database: ${supabaseUrl}`);
  console.log("");

  // Show current counts
  const beforeCounts = await getTableCounts();
  const totalRows = Object.values(beforeCounts).reduce((a, b) => a + b, 0);

  if (totalRows === 0) {
    console.log("✅ Database is already empty!");
    console.log("");
    return;
  }

  console.log("⚠️  WARNING: This will delete ALL data from all tables!");
  console.log("   Schema and default threshold will be preserved.");
  console.log("");

  const confirmed = await askConfirmation();

  if (!confirmed) {
    console.log("");
    console.log("❌ Cancelled. No data was deleted.");
    console.log("");
    process.exit(0);
  }

  console.log("");
  console.log("🗑️  Deleting data (in dependency order)...");
  console.log("");

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
        console.log(
          `   ✅ ${table.padEnd(25)} ${deleted.toString().padStart(5)} deleted (kept default)`,
        );
      } else {
        console.log(
          `   ✅ ${table.padEnd(25)} ${deleted.toString().padStart(5)} deleted`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ ${table.padEnd(25)} Failed: ${message}`);
    }
  }

  console.log("");
  console.log("════════════════════════════════════════════════════════════");
  console.log("");

  // Verify deletion
  const afterCounts = await getTableCounts();
  const remainingRows = Object.values(afterCounts).reduce((a, b) => a + b, 0);

  console.log("✅ Data cleared successfully!");
  console.log("");
  console.log(`   Total deleted: ${totalDeleted} rows`);
  console.log(`   Remaining:     ${remainingRows} rows (default threshold)`);
  console.log("");
  console.log("💡 To re-seed data:");
  console.log("   Dashboard → SQL Editor → Run supabase/seed.sql");
  console.log("");
}

async function main() {
  try {
    await clearAllData();
  } catch (error) {
    console.error("");
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Failed to clear data:", message);
    console.error("");
    console.error("💡 Alternative: Run in Dashboard SQL Editor:");
    console.error("   scripts/clear-data.sql");
    console.error("");
    process.exit(1);
  }
}

main();
