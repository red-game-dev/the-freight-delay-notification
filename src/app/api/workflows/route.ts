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

interface WorkflowListItem {
  id: string;
  workflow_id: string;
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
  };
}

/**
 * GET /api/workflows
 * List workflow executions from both database and active deliveries
 * Query params:
 * - deliveryId: Filter by delivery ID
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();

  // Validate query parameters
  const queryResult = validateQuery(listWorkflowsQuerySchema, request);
  if (!queryResult.success) {
    return queryResult;
  }

  const { page, limit, delivery_id: deliveryId } = queryResult.value;

  if (deliveryId) {
    // Transform filtered result to only expose safe fields with pagination
    return Result.map(
      await db.listWorkflowExecutionsByDelivery(deliveryId),
      (workflows) => {
        const sanitizedWorkflows = workflows.map((w) => ({
          id: w.id,
          workflow_id: w.workflow_id,
          delivery_id: w.delivery_id,
          status: w.status,
          started_at: w.started_at,
          completed_at: w.completed_at,
          error_message: w.error_message,
        }));

        return createPaginatedResponse(sanitizedWorkflows, page, limit);
      }
    );
  }

  // Get completed workflows from database via DatabaseService
  const dbWorkflows = Result.unwrapOr(await db.listWorkflowExecutions(1000), []);

  // Get all recent deliveries with workflow settings via DatabaseService
  const allDeliveries = Result.unwrapOr(await db.listDeliveries(1000), []);

  // Combine and format results
  const workflows: WorkflowListItem[] = [];

  // Add database workflows
  if (dbWorkflows) {
    workflows.push(...dbWorkflows.map(w => ({
      ...w,
      started_at: w.started_at instanceof Date ? w.started_at : new Date(w.started_at),
      completed_at: w.completed_at ? (w.completed_at instanceof Date ? w.completed_at : new Date(w.completed_at)) : null,
      source: 'database' as const,
    })));
  }

  // Check Temporal for running workflows for all deliveries
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

          // Only add if workflow is not already in database
          const alreadyInDb = dbWorkflows?.some(w => w.workflow_id === workflowId);
          if (!alreadyInDb) {
            // Map Temporal status names to our format
            let status = description.status.name.toLowerCase();
            if (status === 'terminated') status = 'cancelled';

            workflows.push({
              id: workflowId,
              workflow_id: workflowId,
              delivery_id: delivery.id,
              status,
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
              },
            });
          }
        } catch (err) {
          // Workflow doesn't exist in Temporal, skip it
          continue;
        }
      }
    }
  }

  // Sort by started_at descending
  workflows.sort((a, b) => {
    const dateA = new Date(a.started_at).getTime();
    const dateB = new Date(b.started_at).getTime();
    return dateB - dateA;
  });

  return Result.ok(createPaginatedResponse(workflows, page, limit));
});
