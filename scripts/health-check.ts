/**
 * System Health Check
 * Quick verification that all components are running and accessible
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import { logger } from "@/core/base/utils/Logger";

config({ path: resolve(process.cwd(), ".env.local") });

interface HealthCheckResult {
  component: string;
  status: "healthy" | "unhealthy" | "unknown";
  message: string;
  details?: unknown;
}

const results: HealthCheckResult[] = [];

async function checkNextJs() {
  try {
    const response = await fetch("http://localhost:3000", {
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      results.push({
        component: "Next.js Dev Server",
        status: "healthy",
        message: "Server is running",
        details: { url: "http://localhost:3000" },
      });
    } else {
      results.push({
        component: "Next.js Dev Server",
        status: "unhealthy",
        message: `Server returned ${response.status}`,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      component: "Next.js Dev Server",
      status: "unhealthy",
      message: "Server is not accessible",
      details: { error: message },
    });
  }
}

async function checkCronEndpoint() {
  try {
    const response = await fetch(
      "http://localhost:3000/api/cron/check-traffic",
      {
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        signal: AbortSignal.timeout(30000), // 30 seconds for traffic checks
      },
    );

    const data = await response.json();

    if (response.ok && data.success) {
      results.push({
        component: "Traffic Monitoring Endpoint",
        status: "healthy",
        message: "Endpoint is working",
        details: data.result,
      });
    } else {
      results.push({
        component: "Traffic Monitoring Endpoint",
        status: "unhealthy",
        message: data.error || "Unknown error",
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      component: "Traffic Monitoring Endpoint",
      status: "unhealthy",
      message: "Endpoint check failed",
      details: { error: message },
    });
  }
}

async function checkTemporal() {
  try {
    const response = await fetch("http://localhost:8233", {
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      results.push({
        component: "Temporal UI (Optional)",
        status: "healthy",
        message: "Temporal UI is accessible",
        details: { url: "http://localhost:8233" },
      });
    } else {
      results.push({
        component: "Temporal UI (Optional)",
        status: "unknown",
        message: "Temporal UI returned unexpected status",
      });
    }
  } catch {
    results.push({
      component: "Temporal UI (Optional)",
      status: "unknown",
      message: "Temporal UI not accessible (worker may still be running)",
      details: { hint: "Check if worker is running: pnpm run temporal:worker" },
    });
  }
}

async function checkSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    results.push({
      component: "Supabase (Remote)",
      status: "unhealthy",
      message: "Supabase credentials not set",
    });
    return;
  }

  // For remote Supabase, just verify credentials are configured
  results.push({
    component: "Supabase (Remote)",
    status: "healthy",
    message: "Credentials configured",
    details: { url: `${supabaseUrl.substring(0, 30)}...` },
  });
}

function checkEnvVars() {
  const requiredVars = [
    "GOOGLE_MAPS_API_KEY",
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    "CRON_SECRET",
    "CRON_INTERVAL_SECONDS",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "TEMPORAL_ADDRESS",
    "OPENAI_API_KEY",
  ];

  const missing: string[] = [];
  const set: string[] = [];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      set.push(varName);
    } else {
      missing.push(varName);
    }
  }

  if (missing.length === 0) {
    results.push({
      component: "Environment Variables",
      status: "healthy",
      message: "All required variables are set",
      details: { count: set.length },
    });
  } else {
    results.push({
      component: "Environment Variables",
      status: "unhealthy",
      message: `${missing.length} variables missing`,
      details: { missing },
    });
  }
}

function printResults() {
  console.clear();
  logger.info("╔════════════════════════════════════════════════════════════╗");
  logger.info("║           🏥 SYSTEM HEALTH CHECK RESULTS                   ║");
  logger.info("╚════════════════════════════════════════════════════════════╝");
  logger.info("");

  let healthyCount = 0;
  let unhealthyCount = 0;

  for (const result of results) {
    const icon =
      result.status === "healthy"
        ? "✅"
        : result.status === "unhealthy"
          ? "❌"
          : "⚠️ ";
    logger.info(`${icon} ${result.component}`);
    logger.info(`   ${result.message}`);

    if (result.details) {
      const details = JSON.stringify(result.details, null, 2)
        .split("\n")
        .slice(1, -1)
        .join("\n   ");
      logger.info(`   ${details}`);
    }

    logger.info("");

    if (result.status === "healthy") healthyCount++;
    if (result.status === "unhealthy") unhealthyCount++;
  }

  logger.info("────────────────────────────────────────────────────────────");
  logger.info(`Summary: ${healthyCount} healthy, ${unhealthyCount} unhealthy`);
  logger.info("────────────────────────────────────────────────────────────");
  logger.info("");

  if (unhealthyCount === 0) {
    logger.info("🎉 All systems operational! Ready to start monitoring.");
    logger.info("");
    logger.info("Next steps:");
    logger.info("  1. Terminal 1: npm run dev");
    logger.info("  2. Terminal 2: npm run temporal:worker");
    logger.info("  3. Terminal 3: npm run cron:dev");
    logger.info("  4. Terminal 4: npm run monitor:system (optional)");
    logger.info("");
  } else {
    logger.warn(
      "⚠️  Some components are not healthy. Please review the errors above.",
    );
    logger.info("");

    if (
      results.find(
        (r) => r.component === "Next.js Dev Server" && r.status === "unhealthy",
      )
    ) {
      logger.info("💡 Start Next.js: npm run dev");
    }
    if (
      results.find(
        (r) => r.component.includes("Temporal") && r.status === "unhealthy",
      )
    ) {
      logger.info(
        "💡 Start Temporal: Ensure temporal worker is running (pnpm run temporal:worker)",
      );
    }
    if (
      results.find(
        (r) => r.component === "Supabase (Remote)" && r.status === "unhealthy",
      )
    ) {
      logger.info("💡 Check Supabase credentials in .env.local");
    }
    if (
      results.find(
        (r) =>
          r.component === "Environment Variables" && r.status === "unhealthy",
      )
    ) {
      logger.info("💡 Check .env.local: Copy from .env.example if needed");
    }

    logger.info("");
  }
}

async function runHealthCheck() {
  logger.info("🏥 Running system health check...\n");

  // Check environment variables first (synchronous)
  checkEnvVars();

  // Check services (async, in parallel)
  await Promise.all([checkNextJs(), checkTemporal(), checkSupabase()]);

  // Check cron endpoint (requires Next.js to be running)
  if (
    results.find(
      (r) => r.component === "Next.js Dev Server" && r.status === "healthy",
    )
  ) {
    await checkCronEndpoint();
  }

  // Print results
  printResults();
}

runHealthCheck().catch((error) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
