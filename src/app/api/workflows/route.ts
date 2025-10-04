/**
 * Workflows API Routes
 * GET /api/workflows - List all workflow executions (database + active deliveries)
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import { createWorkflowId, parseWorkflowId, WorkflowType } from '@/core/utils/workflowUtils';
import { createPaginatedResponse } from '@/core/utils/paginationUtils';
import { validateQuery } from '@/core/utils/validation';
import { listWorkflowsQuerySchema } from '@/core/schemas/workflow';
import { setAuditContext } from '@/app/api/middleware/auditContext';

interface WorkflowListItem {
  id: string;
  workflow_id: string;
  run_id?: string;
  delivery_id: string | null;
  status: string;
  started_at: Date;
  completed_at: Date | null;
  error_message: string | null;
  source: 'database' | 'temporal';
  tracking_number?: string;
  settings?: {
    type: 'recurring' | 'one-time';
    check_interval_minutes: number;
    max_checks: number;
    checks_performed: number;
    delay_threshold_minutes: number;
    min_delay_change_threshold: number;
    min_hours_between_notifications: number;
    scheduled_delivery: Date;
    last_check_time?: string; // From delivery.updated_at - for accurate next run calculation
  };
}

/**
 * GET /api/workflows
 * List workflow executions from both database and active deliveries
 * Query params:
 * - delivery_id: Filter by delivery ID
 * - status: Filter by specific status (e.g., 'running')
 * - statusNot: Exclude specific status (e.g., 'running' to get all non-running)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 */
export const GET = createApiHandler(async (request) => {
  await setAuditContext(request);
  const db = getDatabaseService();

  // Validate query parameters
  const queryResult = validateQuery(listWorkflowsQuerySchema, request);
  if (!queryResult.success) {
    return queryResult;
  }

  const { page, limit, delivery_id: deliveryId, status, statusNot } = queryResult.value;

  if (deliveryId) {
    // Get completed workflows from database
    const dbWorkflows = Result.unwrapOr(
      await db.listWorkflowExecutionsByDelivery(deliveryId),
      []
    );

    // Get delivery details for workflow settings
    const deliveryResult = await db.getDeliveryById(deliveryId);
    const delivery = Result.unwrapOr(deliveryResult, null);

    const workflows: WorkflowListItem[] = [];
    const temporalExecutions = new Set<string>(); // Track workflow_id + run_id pairs

    // Check Temporal for workflows for this specific delivery
    // We check Temporal FIRST to get fresh status, then merge with DB
    if (delivery) {
      const client = await getTemporalClient();
      const workflowIds = [
        createWorkflowId(WorkflowType.RECURRING_CHECK, deliveryId, false),
        createWorkflowId(WorkflowType.DELAY_NOTIFICATION, deliveryId, false),
      ];

      for (const workflowId of workflowIds) {
        try {
          const handle = client.workflow.getHandle(workflowId);
          const description = await handle.describe();

          // Track this execution by workflow_id + run_id
          temporalExecutions.add(`${workflowId}:${description.runId}`);

          // Map Temporal status names to our format
          let status = description.status.name.toLowerCase();
          if (status === 'terminated') status = 'cancelled';

          workflows.push({
            id: workflowId,
            workflow_id: workflowId,
            run_id: description.runId,
            delivery_id: deliveryId,
            status, // Always use Temporal's fresh status
            started_at: description.startTime,
            completed_at: description.closeTime || null,
            error_message: null, // Error details stored in DB, not easily extractable from Temporal description
            source: 'temporal' as const,
            tracking_number: delivery.tracking_number,
            settings: {
              type: parseWorkflowId(workflowId)?.type === WorkflowType.RECURRING_CHECK ? 'recurring' : 'one-time',
              check_interval_minutes: delivery.check_interval_minutes,
              max_checks: delivery.max_checks,
              checks_performed: delivery.checks_performed,
              delay_threshold_minutes: delivery.delay_threshold_minutes,
              min_delay_change_threshold: delivery.min_delay_change_threshold,
              min_hours_between_notifications: delivery.min_hours_between_notifications,
              scheduled_delivery: delivery.scheduled_delivery,
              last_check_time: delivery.updated_at instanceof Date
                ? delivery.updated_at.toISOString()
                : delivery.updated_at, // For accurate next run calculation
            },
          });

          // Sync DB status if it's stale (optional - keeps DB in sync)
          // Match by BOTH workflow_id AND run_id to update the correct execution
          const dbWorkflow = dbWorkflows.find(w => w.workflow_id === workflowId && w.run_id === description.runId);
          if (dbWorkflow && dbWorkflow.status !== status) {
            // Update DB status in background (don't await)
            db.updateWorkflowExecution(dbWorkflow.id, {
              status: status as any,
              completed_at: description.closeTime || undefined,
            }).catch(err => {
              // Ignore errors - DB sync is best-effort
            });
          }
        } catch (err) {
          // Workflow doesn't exist in Temporal or error fetching it
          // It may still exist in database, so we'll show it from there
          console.warn(`Failed to fetch workflow ${workflowId} from Temporal:`, err);
          continue;
        }
      }
    }

    // Add database workflows that aren't already shown from Temporal
    // Deduplicate by (workflow_id, run_id) pair
    workflows.push(...dbWorkflows
      .filter(w => !temporalExecutions.has(`${w.workflow_id}:${w.run_id}`))
      .map(w => ({
        ...w,
        started_at: w.started_at instanceof Date ? w.started_at : new Date(w.started_at),
        completed_at: w.completed_at ? (w.completed_at instanceof Date ? w.completed_at : new Date(w.completed_at)) : null,
        source: 'database' as const,
      }))
    );

    // Apply status filters if provided
    let filteredWorkflows = workflows;

    if (status) {
      filteredWorkflows = filteredWorkflows.filter(w => w.status === status);
    }

    if (statusNot) {
      filteredWorkflows = filteredWorkflows.filter(w => w.status !== statusNot);
    }

    // Sort by started_at descending
    filteredWorkflows.sort((a, b) => {
      const dateA = new Date(a.started_at).getTime();
      const dateB = new Date(b.started_at).getTime();
      return dateB - dateA;
    });

    const sanitizedWorkflows = filteredWorkflows.map((w) => ({
      id: w.id,
      workflow_id: w.workflow_id,
      ...(w.run_id && { run_id: w.run_id }),
      delivery_id: w.delivery_id,
      status: w.status,
      started_at: w.started_at,
      completed_at: w.completed_at,
      error_message: w.error_message,
      ...(w.tracking_number && { tracking_number: w.tracking_number }),
      ...(w.settings && { settings: w.settings }),
    }));

    return Result.ok(createPaginatedResponse(sanitizedWorkflows, page, limit));
  }

  // Get completed workflows from database via DatabaseService
  const dbWorkflows = Result.unwrapOr(await db.listWorkflowExecutions(1000), []);
  console.log(`[Workflows API] Found ${dbWorkflows.length} workflows in database`);
  console.log(`[Workflows API] DB workflow statuses:`, dbWorkflows.map(w => ({ id: w.workflow_id, status: w.status })));

  // Get all recent deliveries with workflow settings via DatabaseService
  const allDeliveries = Result.unwrapOr(await db.listDeliveries(1000), []);

  // Combine and format results
  const workflows: WorkflowListItem[] = [];
  const temporalExecutions = new Set<string>(); // Track workflow_id + run_id pairs

  // Check Temporal for workflows for all deliveries
  // We check Temporal FIRST to get fresh status, then merge with DB
  if (allDeliveries) {
    const client = await getTemporalClient();

    for (const delivery of allDeliveries) {
      // Check both recurring and one-time workflow patterns
      const workflowIds = [
        createWorkflowId(WorkflowType.RECURRING_CHECK, delivery.id, false),
        createWorkflowId(WorkflowType.DELAY_NOTIFICATION, delivery.id, false),
      ];

      for (const workflowId of workflowIds) {
        try {
          const handle = client.workflow.getHandle(workflowId);
          const description = await handle.describe();

          // Track this execution by workflow_id + run_id
          temporalExecutions.add(`${workflowId}:${description.runId}`);

          // Map Temporal status names to our format
          let status = description.status.name.toLowerCase();
          if (status === 'terminated') status = 'cancelled';

          workflows.push({
            id: workflowId,
            workflow_id: workflowId,
            run_id: description.runId,
            delivery_id: delivery.id,
            status, // Always use Temporal's fresh status
            started_at: description.startTime,
            completed_at: description.closeTime || null,
            error_message: null,
            source: 'temporal' as const,
            tracking_number: delivery.tracking_number,
            // Add workflow settings
            settings: {
              type: parseWorkflowId(workflowId)?.type === WorkflowType.RECURRING_CHECK ? 'recurring' : 'one-time',
              check_interval_minutes: delivery.check_interval_minutes,
              max_checks: delivery.max_checks,
              checks_performed: delivery.checks_performed,
              delay_threshold_minutes: delivery.delay_threshold_minutes,
              min_delay_change_threshold: delivery.min_delay_change_threshold,
              min_hours_between_notifications: delivery.min_hours_between_notifications,
              scheduled_delivery: delivery.scheduled_delivery,
              last_check_time: delivery.updated_at instanceof Date
                ? delivery.updated_at.toISOString()
                : delivery.updated_at, // For accurate next run calculation
            },
          });

          // Sync DB status if it's stale (optional - keeps DB in sync)
          // Match by BOTH workflow_id AND run_id to update the correct execution
          const dbWorkflow = dbWorkflows?.find(w => w.workflow_id === workflowId && w.run_id === description.runId);
          if (dbWorkflow && dbWorkflow.status !== status) {
            // Update DB status in background (don't await)
            db.updateWorkflowExecution(dbWorkflow.id, {
              status: status as any,
              completed_at: description.closeTime || undefined,
            }).catch(err => {
              // Ignore errors - DB sync is best-effort
            });
          }
        } catch (err) {
          // Workflow doesn't exist in Temporal, skip it
          continue;
        }
      }
    }
  }

  // Add database workflows that aren't already shown from Temporal
  // Deduplicate by (workflow_id, run_id) pair
  if (dbWorkflows) {
    workflows.push(...dbWorkflows
      .filter(w => !temporalExecutions.has(`${w.workflow_id}:${w.run_id}`))
      .map(w => ({
        ...w,
        started_at: w.started_at instanceof Date ? w.started_at : new Date(w.started_at),
        completed_at: w.completed_at ? (w.completed_at instanceof Date ? w.completed_at : new Date(w.completed_at)) : null,
        source: 'database' as const,
      }))
    );
  }

  // Apply status filters if provided
  let filteredWorkflows = workflows;

  if (status) {
    filteredWorkflows = filteredWorkflows.filter(w => w.status === status);
  }

  if (statusNot) {
    filteredWorkflows = filteredWorkflows.filter(w => w.status !== statusNot);
  }

  // Sort by started_at descending
  filteredWorkflows.sort((a, b) => {
    const dateA = new Date(a.started_at).getTime();
    const dateB = new Date(b.started_at).getTime();
    return dateB - dateA;
  });

  return Result.ok(createPaginatedResponse(filteredWorkflows, page, limit));
});
