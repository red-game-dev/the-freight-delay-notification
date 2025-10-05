/**
 * Test Complete 4-Step Workflow
 * Tests the entire PDF workflow from traffic check to notification delivery
 */

import { Client, Connection } from "@temporalio/client";
import { config } from "dotenv";
import { logger } from "../src/core/base/utils/Logger";
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
  logger.info("==========================================\n");

  try {
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

    // Prepare workflow input
    const workflowInput: DelayNotificationWorkflowInput = {
      deliveryId: `TEST-${Date.now()}`,
      routeId: "ROUTE-001",
      customerId: "CUSTOMER-123",
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
      logger.info(`   Model: ${result.steps.messageGeneration.model}`);
      logger.info(`   Subject: ${result.steps.messageGeneration.subject}`);
      logger.info(
        `   Fallback Used: ${result.steps.messageGeneration.fallbackUsed ? "YES" : "NO"}`,
      );
      if (result.steps.messageGeneration.tokens) {
        logger.info(`   Tokens: ${result.steps.messageGeneration.tokens}`);
      }
      logger.info(`\n   Message Preview:`);
      logger.info(
        `   ${result.steps.messageGeneration.message.substring(0, 200)}...`,
      );
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

    await connection.close();
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("\n❌ Workflow test failed:", message);
    logger.error("\nMake sure:");
    logger.error("  1. Temporal server is running: npm run temporal");
    logger.error("  2. Worker is running: npm run temporal:worker");
    logger.error("  3. API keys are configured in .env.local\n");
    process.exit(1);
  }
}

testCompleteWorkflow();
