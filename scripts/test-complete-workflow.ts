/**
 * Test Complete 4-Step Workflow
 * Tests the entire PDF workflow from traffic check to notification delivery
 */

import { Client, Connection } from "@temporalio/client";
import { config } from "dotenv";
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

  console.log("🧪 Testing Complete 4-Step PDF Workflow");
  console.log("==========================================\n");

  try {
    // Connect to Temporal
    console.log("📡 Connecting to Temporal server...");
    const connection = await Connection.connect({
      address: "localhost:7233",
    });

    const client = new Client({
      connection,
      namespace: "default",
    });

    console.log("✅ Connected to Temporal\n");

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

    console.log("📋 Workflow Input:");
    console.log(`   Delivery ID: ${workflowInput.deliveryId}`);
    console.log(
      `   Route: ${workflowInput.origin.address} → ${workflowInput.destination.address}`,
    );
    console.log(`   Threshold: ${workflowInput.thresholdMinutes} minutes`);
    console.log(`   Email: ${workflowInput.customerEmail}`);
    console.log(`   Phone: ${workflowInput.customerPhone}`);
    console.log("");

    // Start workflow
    console.log("🚀 Starting DelayNotificationWorkflow...\n");

    const handle = await client.workflow.start("DelayNotificationWorkflow", {
      taskQueue: process.env.TEMPORAL_TASK_QUEUE || "freight-delay-queue",
      workflowId: workflowInput.deliveryId,
      args: [workflowInput],
    });

    console.log(`✅ Workflow started: ${handle.workflowId}`);
    console.log(`   Run ID: ${handle.firstExecutionRunId}`);
    console.log("");

    // Wait for workflow to complete
    console.log("⏳ Waiting for workflow to complete...\n");
    console.log("━".repeat(50));

    const result = await handle.result();

    console.log("━".repeat(50));
    console.log("");
    console.log("✅ Workflow completed successfully!\n");

    // Display results
    console.log("📊 Workflow Results:");
    console.log("=".repeat(50));

    if (result.steps.trafficCheck) {
      console.log("\n🚦 Step 1: Traffic Check");
      console.log(`   Provider: ${result.steps.trafficCheck.provider}`);
      console.log(
        `   Delay: ${result.steps.trafficCheck.delayMinutes} minutes`,
      );
      console.log(
        `   Condition: ${result.steps.trafficCheck.trafficCondition}`,
      );
      console.log(
        `   Normal Duration: ${result.steps.trafficCheck.normalDurationMinutes} min`,
      );
      console.log(
        `   With Traffic: ${result.steps.trafficCheck.estimatedDurationMinutes} min`,
      );
    }

    if (result.steps.delayEvaluation) {
      console.log("\n📊 Step 2: Delay Evaluation");
      console.log(
        `   Exceeds Threshold: ${result.steps.delayEvaluation.exceedsThreshold ? "YES" : "NO"}`,
      );
      console.log(
        `   Delay: ${result.steps.delayEvaluation.delayMinutes} min vs Threshold: ${result.steps.delayEvaluation.thresholdMinutes} min`,
      );
      console.log(`   Severity: ${result.steps.delayEvaluation.severity}`);
      console.log(
        `   Notification Required: ${result.steps.delayEvaluation.requiresNotification ? "YES" : "NO"}`,
      );
    }

    if (result.steps.messageGeneration) {
      console.log("\n🤖 Step 3: AI Message Generation");
      console.log(`   Model: ${result.steps.messageGeneration.model}`);
      console.log(`   Subject: ${result.steps.messageGeneration.subject}`);
      console.log(
        `   Fallback Used: ${result.steps.messageGeneration.fallbackUsed ? "YES" : "NO"}`,
      );
      if (result.steps.messageGeneration.tokens) {
        console.log(`   Tokens: ${result.steps.messageGeneration.tokens}`);
      }
      console.log(`\n   Message Preview:`);
      console.log(
        `   ${result.steps.messageGeneration.message.substring(0, 200)}...`,
      );
    }

    if (result.steps.notificationDelivery) {
      console.log("\n📬 Step 4: Notification Delivery");
      console.log(`   Channel: ${result.steps.notificationDelivery.channel}`);
      console.log(
        `   Sent: ${result.steps.notificationDelivery.sent ? "YES" : "NO"}`,
      );

      if (result.steps.notificationDelivery.emailResult) {
        const email = result.steps.notificationDelivery.emailResult;
        console.log(`\n   📧 Email:`);
        console.log(`      Provider: ${email.provider}`);
        console.log(`      Success: ${email.success ? "YES" : "NO"}`);
        if (email.success && email.messageId) {
          console.log(`      Message ID: ${email.messageId}`);
        }
        if (!email.success && email.error) {
          console.log(`      Error: ${email.error}`);
        }
      }

      if (result.steps.notificationDelivery.smsResult) {
        const sms = result.steps.notificationDelivery.smsResult;
        console.log(`\n   📱 SMS:`);
        console.log(`      Provider: ${sms.provider}`);
        console.log(`      Success: ${sms.success ? "YES" : "NO"}`);
        if (sms.success && sms.messageId) {
          console.log(`      Message ID: ${sms.messageId}`);
        }
        if (!sms.success && sms.error) {
          console.log(`      Error: ${sms.error}`);
        }
      }
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log("\n✨ All 4 steps of the PDF workflow completed!");
    console.log(
      `   View in Temporal UI: http://localhost:8233/namespaces/default/workflows/${handle.workflowId}\n`,
    );

    await connection.close();
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\n❌ Workflow test failed:", message);
    console.error("\nMake sure:");
    console.error("  1. Temporal server is running: npm run temporal");
    console.error("  2. Worker is running: npm run temporal:worker");
    console.error("  3. API keys are configured in .env.local\n");
    process.exit(1);
  }
}

testCompleteWorkflow();
