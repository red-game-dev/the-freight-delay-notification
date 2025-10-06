/**
 * Test Complete 4-Step Workflow
 * Tests the entire PDF exercise workflow from traffic check to notification delivery
 *
 * This script validates all 4 workflow requirements from the PDF:
 *
 * Step 1: Fetch traffic data for a specified route (calculates delay in minutes)
 * Step 2: Check if delay exceeds threshold (e.g., 30 minutes)
 *         - If delay > threshold → proceed to Step 3
 *         - If delay ≤ threshold → do nothing further
 * Step 3: Generate friendly customer message using AI (gpt-4o-mini)
 *         - Separate prompts for email vs SMS (60 char SMS limit)
 *         - Falls back to templates if AI fails
 * Step 4: Send notification to customer via email/SMS
 *         - SendGrid for email, Twilio for SMS
 *         - Mock adapters available for testing without API keys
 *
 * Usage:
 *   pnpm run test:workflow                    # Default: Times Square → JFK, 30 min threshold
 *   pnpm run test:workflow -- --threshold 5   # Custom threshold
 *   pnpm run test:workflow -- --origin "Lisbon, Portugal" --destination "Porto, Portugal"
 */

import { Client, Connection } from "@temporalio/client";
import { config } from "dotenv";
import { logger } from "../src/core/base/utils/Logger";
import { getDatabaseService } from "../src/infrastructure/database";
import type { DelayNotificationWorkflowInput } from "../src/workflows/types";

// Load .env.local file
config({ path: ".env.local" });

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    origin: process.env.TEST_ORIGIN || "Times Square, Manhattan, NY",
    destination: process.env.TEST_DESTINATION || "JFK Airport, Queens, NY",
    threshold: parseInt(process.env.TEST_THRESHOLD || "30", 10),
    name: process.env.TEST_NAME || "Test Customer",
    email: process.env.TEST_EMAIL || "test@example.com",
    phone: process.env.TEST_PHONE || "+1234567890",
  };

  // Parse command-line overrides
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--origin" && args[i + 1]) {
      options.origin = args[i + 1];
      i++;
    } else if (args[i] === "--destination" && args[i + 1]) {
      options.destination = args[i + 1];
      i++;
    } else if (args[i] === "--threshold" && args[i + 1]) {
      options.threshold = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return options;
}

async function testCompleteWorkflow() {
  const options = parseArgs();

  logger.info("🧪 Testing Complete 4-Step PDF Workflow");
  logger.info("==========================================");
  logger.info("This test validates the exercise requirements:");
  logger.info("  ✓ Step 1: Fetch traffic data (Google Maps/Mapbox)");
  logger.info("  ✓ Step 2: Check delay vs threshold");
  logger.info("  ✓ Step 3: Generate AI message (gpt-4o-mini)");
  logger.info("  ✓ Step 4: Send email/SMS notification");
  logger.info("");

  let customerId: string | undefined;
  let routeId: string | undefined;
  let deliveryId: string | undefined;
  const db = getDatabaseService();

  try {
    // Step 0: Create test data in database
    logger.info("📦 Creating test data in database...");

    // 1. Check if customer exists, create if not
    const existingCustomerResult = await db.getCustomerByEmail(options.email);
    if (existingCustomerResult.success && existingCustomerResult.value) {
      customerId = existingCustomerResult.value.id;
      logger.info(`   ♻️  Using existing customer: ${customerId}`);
    } else {
      const customerResult = await db.createCustomer({
        email: options.email,
        phone: options.phone,
        name: options.name,
      });

      if (!customerResult.success) {
        throw new Error(`Failed to create customer: ${customerResult.error.message}`);
      }

      customerId = customerResult.value.id;
      logger.info(`   ✅ Customer created: ${customerId}`);
    }

    // 2. Create test route (routes are typically unique per origin/destination)
    const routeResult = await db.createRoute({
      origin_address: options.origin,
      origin_coords: { x: 40.758896, y: -73.985130 }, // Times Square coords (will be geocoded in real scenario)
      destination_address: options.destination,
      destination_coords: { x: 40.6413, y: -73.7781 }, // JFK coords
      distance_meters: 26000, // ~26km
      normal_duration_seconds: 1800, // 30 min normal
    });

    if (!routeResult.success) {
      throw new Error(`Failed to create route: ${routeResult.error.message}`);
    }

    routeId = routeResult.value.id;
    logger.info(`   ✅ Route created: ${routeId}`);

    // 3. Create test delivery with unique tracking number
    const trackingNumber = `TEST-${Date.now()}`;
    const deliveryResult = await db.createDelivery({
      tracking_number: trackingNumber,
      customer_id: customerId,
      route_id: routeId,
      scheduled_delivery: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      delay_threshold_minutes: options.threshold,
      auto_check_traffic: true,
      enable_recurring_checks: false,
      status: "pending",
    });

    if (!deliveryResult.success) {
      throw new Error(`Failed to create delivery: ${deliveryResult.error.message}`);
    }

    deliveryId = deliveryResult.value.id;
    logger.info(`   ✅ Delivery created: ${deliveryId}`);
    logger.info(`   ✅ Tracking number: ${deliveryResult.value.tracking_number}`);
    logger.info("");

    // Connect to Temporal
    logger.info("📡 Connecting to Temporal server...");
    const connection = await Connection.connect({
      address: "localhost:7233",
    });

    const client = new Client({
      connection,
      namespace: "default",
    });

    logger.info("✅ Connected to Temporal\n");

    // Prepare workflow input with real database IDs
    const workflowInput: DelayNotificationWorkflowInput = {
      deliveryId: deliveryId!,
      routeId: routeId!,
      customerId: customerId!,
      customerEmail: options.email,
      customerPhone: options.phone,
      origin: {
        address: options.origin,
        coordinates: undefined, // Let adapters geocode the address
      },
      destination: {
        address: options.destination,
        coordinates: undefined, // Let adapters geocode the address
      },
      scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      thresholdMinutes: options.threshold,
    };

    logger.info("📋 Workflow Input:");
    logger.info(`   Delivery ID: ${workflowInput.deliveryId}`);
    logger.info(
      `   Route: ${workflowInput.origin.address} → ${workflowInput.destination.address}`,
    );
    logger.info(`   Threshold: ${workflowInput.thresholdMinutes} minutes`);
    logger.info(`   Customer: ${options.name}`);
    logger.info(`   Email: ${workflowInput.customerEmail}`);
    logger.info(`   Phone: ${workflowInput.customerPhone}`);
    logger.info("");

    // Start workflow
    logger.info("🚀 Starting DelayNotificationWorkflow...\n");

    const handle = await client.workflow.start("DelayNotificationWorkflow", {
      taskQueue: process.env.TEMPORAL_TASK_QUEUE || "freight-delay-queue",
      workflowId: workflowInput.deliveryId,
      args: [workflowInput],
    });

    logger.info(`✅ Workflow started: ${handle.workflowId}`);
    logger.info(`   Run ID: ${handle.firstExecutionRunId}`);
    logger.info("");

    // Wait for workflow to complete
    logger.info("⏳ Waiting for workflow to complete...\n");
    logger.info("━".repeat(50));

    const result = await handle.result();

    logger.info("━".repeat(50));
    logger.info("");
    logger.info("✅ Workflow completed successfully!\n");

    // Display results
    logger.info("📊 Workflow Results:");
    logger.info("=".repeat(50));

    if (result.steps.trafficCheck) {
      logger.info("\n🚦 Step 1: Traffic Check");
      logger.info(`   Provider: ${result.steps.trafficCheck.provider}`);
      logger.info(
        `   Delay: ${result.steps.trafficCheck.delayMinutes} minutes`,
      );
      logger.info(
        `   Condition: ${result.steps.trafficCheck.trafficCondition}`,
      );
      logger.info(
        `   Normal Duration: ${result.steps.trafficCheck.normalDurationMinutes} min`,
      );
      logger.info(
        `   With Traffic: ${result.steps.trafficCheck.estimatedDurationMinutes} min`,
      );
    }

    if (result.steps.delayEvaluation) {
      logger.info("\n📊 Step 2: Delay Evaluation");
      logger.info(
        `   Exceeds Threshold: ${result.steps.delayEvaluation.exceedsThreshold ? "YES" : "NO"}`,
      );
      logger.info(
        `   Delay: ${result.steps.delayEvaluation.delayMinutes} min vs Threshold: ${result.steps.delayEvaluation.thresholdMinutes} min`,
      );
      logger.info(`   Severity: ${result.steps.delayEvaluation.severity}`);
      logger.info(
        `   Notification Required: ${result.steps.delayEvaluation.requiresNotification ? "YES" : "NO"}`,
      );
    }

    if (result.steps.messageGeneration) {
      logger.info("\n🤖 Step 3: AI Message Generation");

      if (result.steps.messageGeneration.email) {
        const email = result.steps.messageGeneration.email;
        logger.info("\n   📧 Email Message:");
        logger.info(`      Subject: ${email.subject}`);
        logger.info(`      AI Generated: ${email.aiGenerated ? "YES" : "NO"}`);
        if (email.model) {
          logger.info(`      Model: ${email.model}`);
        }
        if (email.tokens) {
          logger.info(`      Tokens: ${email.tokens}`);
        }
        logger.info(`\n      ─── Full Email Body ───`);
        // Split email body into lines for better readability
        const emailLines = email.body.split("\n");
        emailLines.forEach((line: string) => {
          logger.info(`      ${line}`);
        });
        logger.info(`      ─────────────────────────`);
      }

      if (result.steps.messageGeneration.sms) {
        const sms = result.steps.messageGeneration.sms;
        logger.info("\n   📱 SMS Message:");
        logger.info(`      AI Generated: ${sms.aiGenerated ? "YES" : "NO"}`);
        if (sms.model) {
          logger.info(`      Model: ${sms.model}`);
        }
        if (sms.tokens) {
          logger.info(`      Tokens: ${sms.tokens}`);
        }
        logger.info(`      Length: ${sms.message.length} characters`);
        logger.info(`\n      ─── Full SMS Message ───`);
        logger.info(`      ${sms.message}`);
        logger.info(`      ────────────────────────`);
      }

      logger.info(`\n   Generated At: ${result.steps.messageGeneration.generatedAt}`);
    }

    if (result.steps.notificationDelivery) {
      logger.info("\n📬 Step 4: Notification Delivery");
      logger.info(`   Channel: ${result.steps.notificationDelivery.channel}`);
      logger.info(
        `   Sent: ${result.steps.notificationDelivery.sent ? "YES" : "NO"}`,
      );

      if (result.steps.notificationDelivery.emailResult) {
        const email = result.steps.notificationDelivery.emailResult;
        logger.info(`\n   📧 Email:`);
        logger.info(`      Provider: ${email.provider}`);
        logger.info(`      Success: ${email.success ? "YES" : "NO"}`);
        if (email.success && email.messageId) {
          logger.info(`      Message ID: ${email.messageId}`);
        }
        if (!email.success && email.error) {
          logger.info(`      Error: ${email.error}`);
        }
      }

      if (result.steps.notificationDelivery.smsResult) {
        const sms = result.steps.notificationDelivery.smsResult;
        logger.info(`\n   📱 SMS:`);
        logger.info(`      Provider: ${sms.provider}`);
        logger.info(`      Success: ${sms.success ? "YES" : "NO"}`);
        if (sms.success && sms.messageId) {
          logger.info(`      Message ID: ${sms.messageId}`);
        }
        if (!sms.success && sms.error) {
          logger.info(`      Error: ${sms.error}`);
        }
      }
    }

    logger.info(`\n${"=".repeat(50)}`);
    logger.info("\n✨ All 4 steps of the PDF workflow completed!");
    logger.info(
      `   View in Temporal UI: http://localhost:8233/namespaces/default/workflows/${handle.workflowId}\n`,
    );

    // Cleanup test data
    logger.info("🧹 Cleaning up test data...");
    if (deliveryId) {
      const deleteDeliveryResult = await db.deleteDelivery(deliveryId);
      if (deleteDeliveryResult.success) {
        logger.info(`   ✅ Deleted delivery: ${deliveryId}`);
      } else {
        logger.warn(`   ⚠️  Failed to delete delivery: ${deleteDeliveryResult.error.message}`);
      }
    }
    if (routeId) {
      const deleteRouteResult = await db.deleteRoute(routeId);
      if (deleteRouteResult.success) {
        logger.info(`   ✅ Deleted route: ${routeId}`);
      } else {
        logger.warn(`   ⚠️  Failed to delete route: ${deleteRouteResult.error.message}`);
      }
    }
    logger.info("✅ Cleanup complete\n");

    await connection.close();
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("\n❌ Workflow test failed:", message);
    logger.error("\nMake sure:");
    logger.error("  1. Temporal server is running: pnpm run temporal");
    logger.error("  2. Worker is running: pnpm run temporal:worker");
    logger.error("  3. API keys are configured in .env.local");
    logger.error("\n💡 Testing without API keys? Enable mock adapters in .env.local:");
    logger.error("     FORCE_TRAFFIC_MOCK_ADAPTER=true");
    logger.error("     FORCE_AI_MOCK_ADAPTER=true");
    logger.error("     FORCE_NOTIFICATION_MOCK_ADAPTER=true\n");

    // Note: Test data may remain in database after failure
    if (deliveryId) {
      logger.error("⚠️  Test delivery may remain in database:");
      logger.error(`   Delivery ID: ${deliveryId}`);
      logger.error("   You can manually cancel it from the UI or database\n");
    }

    process.exit(1);
  }
}

testCompleteWorkflow();
