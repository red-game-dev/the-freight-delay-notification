/**
 * Workflow Statistics API Route
 * GET /api/workflows/stats - Get workflow execution statistics
 */

import { setAuditContext } from "@/app/api/middleware/auditContext";
import { logger } from "@/core/base/utils/Logger";
import { Result } from "@/core/base/utils/Result";
import { createApiHandler } from "@/core/infrastructure/http";
import { workflowStatsQuerySchema } from "@/core/schemas/workflow";
import { validateQuery } from "@/core/utils/validation";
import { getDatabaseService } from "@/infrastructure/database/DatabaseService";
import { getTemporalClient } from "@/infrastructure/temporal/TemporalClient";

/**
 * GET /api/workflows/stats
 * Get workflow execution statistics
 *
 * IMPORTANT: Fetches from Temporal first for accurate real-time status.
 * Database may have stale status if workflows failed to save during errors.
 */
export const GET = createApiHandler(async (request) => {
  await setAuditContext(request);
  // Validate query parameters
  const queryResult = validateQuery(workflowStatsQuerySchema, request);
  if (!queryResult.success) {
    return queryResult;
  }

  const { deliveryId } = queryResult.value;
  const db = getDatabaseService();

  logger.info("📊 [Workflows Stats API] Fetching workflow statistics");

  // Get all deliveries with workflow settings (these have active/recent workflows)
  const deliveriesResult = await db.listDeliveries(1000);
  const allDeliveries = Result.unwrapOr(deliveriesResult, []);

  // Get database workflows for historical data
  const dbWorkflowsResult = deliveryId
    ? await db.listWorkflowExecutionsByDelivery(deliveryId)
    : await db.listWorkflowExecutions(1000);

  const dbWorkflows = Result.unwrapOr(dbWorkflowsResult, []);

  // Track which workflows we've seen from Temporal (by workflow_id:run_id)
  const temporalExecutions = new Set<string>();
  const statusCounts = {
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    timed_out: 0,
  };

  // Fetch fresh status from Temporal for deliveries with workflows
  const temporal = await getTemporalClient();
  for (const delivery of allDeliveries) {
    if (!delivery.auto_check_traffic) continue;

    const workflowId = `${delivery.enable_recurring_checks ? "recurring-check" : "delay-notification"}-${delivery.id}`;

    try {
      const handle = temporal.workflow.getHandle(workflowId);
      const description = await handle.describe();

      let status = description.status.name.toLowerCase();

      // Map Temporal status names to our schema
      if (status === "terminated") {
        status = "cancelled";
      } else if (status === "timed out") {
        status = "timed_out";
      } else if (status === "canceled") {
        status = "cancelled";
      }

      // Track this execution
      temporalExecutions.add(`${workflowId}:${description.runId}`);

      // Count by status
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++;
      } else {
        // Log unexpected status for debugging
        logger.warn(
          `⚠️ Unexpected workflow status: ${description.status.name} for ${workflowId}`,
        );
      }
    } catch (_err) {}
  }

  // Add DB workflows that aren't in Temporal (historical only)
  let dbWorkflowsAdded = 0;
  for (const workflow of dbWorkflows) {
    const key = `${workflow.workflow_id}:${workflow.run_id}`;
    if (!temporalExecutions.has(key)) {
      const status = workflow.status;
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++;
        dbWorkflowsAdded++;
      } else {
        logger.warn(
          `⚠️ Unexpected DB workflow status: ${status} for ${workflow.workflow_id}`,
        );
      }
    }
  }

  const total = Object.values(statusCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  logger.info(
    `📊 Workflow stats calculated - Total: ${total}, From Temporal: ${temporalExecutions.size}, From DB: ${dbWorkflowsAdded}, Running: ${statusCounts.running}, Completed: ${statusCounts.completed}, Failed: ${statusCounts.failed}, Cancelled: ${statusCounts.cancelled}, Timed Out: ${statusCounts.timed_out}`,
  );

  return Result.ok({
    total,
    running: statusCounts.running,
    completed: statusCounts.completed,
    failed: statusCounts.failed,
    cancelled: statusCounts.cancelled,
    timed_out: statusCounts.timed_out,
  });
});
