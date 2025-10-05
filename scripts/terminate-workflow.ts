#!/usr/bin/env tsx
/**
 * Terminate a Temporal workflow by ID
 * Usage: tsx scripts/terminate-workflow.ts <workflow-id> [reason]
 */

import { Connection, WorkflowClient } from "@temporalio/client";
import { logger } from "../src/core/base/utils/Logger";

async function terminateWorkflow(workflowId: string, reason?: string) {
  try {
    logger.info(`🔌 Connecting to Temporal at localhost:7233...`);
    const connection = await Connection.connect({
      address: "localhost:7233",
    });

    const client = new WorkflowClient({ connection });

    logger.warn(`⚠️  Terminating workflow: ${workflowId}`);
    logger.info(`📝 Reason: ${reason || "Manual termination"}`);

    const handle = client.getHandle(workflowId);
    await handle.terminate(reason || "Manual termination");

    logger.info(`✅ Workflow ${workflowId} terminated successfully`);
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Failed to terminate workflow:`, error);
    process.exit(1);
  }
}

// Parse command line arguments
const workflowId = process.argv[2];
const reason = process.argv.slice(3).join(" ");

if (!workflowId) {
  logger.error(
    "❌ Usage: tsx scripts/terminate-workflow.ts <workflow-id> [reason]",
  );
  logger.error("");
  logger.error("Example:");
  logger.error(
    '  tsx scripts/terminate-workflow.ts recurring-check-abc123 "Code changed"',
  );
  process.exit(1);
}

terminateWorkflow(workflowId, reason);
