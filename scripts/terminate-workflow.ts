#!/usr/bin/env tsx
/**
 * Terminate a Temporal workflow by ID
 * Usage: tsx scripts/terminate-workflow.ts <workflow-id> [reason]
 */

import { Connection, WorkflowClient } from "@temporalio/client";

async function terminateWorkflow(workflowId: string, reason?: string) {
  try {
    console.log(`🔌 Connecting to Temporal at localhost:7233...`);
    const connection = await Connection.connect({
      address: "localhost:7233",
    });

    const client = new WorkflowClient({ connection });

    console.log(`⚠️  Terminating workflow: ${workflowId}`);
    console.log(`📝 Reason: ${reason || "Manual termination"}`);

    const handle = client.getHandle(workflowId);
    await handle.terminate(reason || "Manual termination");

    console.log(`✅ Workflow ${workflowId} terminated successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Failed to terminate workflow:`, error);
    process.exit(1);
  }
}

// Parse command line arguments
const workflowId = process.argv[2];
const reason = process.argv.slice(3).join(" ");

if (!workflowId) {
  console.error(
    "❌ Usage: tsx scripts/terminate-workflow.ts <workflow-id> [reason]",
  );
  console.error("");
  console.error("Example:");
  console.error(
    '  tsx scripts/terminate-workflow.ts recurring-check-abc123 "Code changed"',
  );
  process.exit(1);
}

terminateWorkflow(workflowId, reason);
