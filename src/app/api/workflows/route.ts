/**
 * Workflows API Routes
 * GET /api/workflows - List all workflow executions (database + active deliveries)
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler, getQueryParam } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';
import { generateRecurringWorkflowId, generateWorkflowId } from '@/core/utils/workflowUtils';

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
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();
  const deliveryId = getQueryParam(request, 'deliveryId');

  if (deliveryId) {
    // Transform filtered result to only expose safe fields
    return Result.map(
      await db.listWorkflowExecutionsByDelivery(deliveryId),
      (workflows) =>
        workflows.map((w) => ({
          id: w.id,
          workflow_id: w.workflow_id,
          delivery_id: w.delivery_id,
          status: w.status,
          started_at: w.started_at,
          completed_at: w.completed_at,
          error_message: w.error_message,
        }))
    );
  }

  // Get completed workflows from database via DatabaseService
  const dbWorkflows = Result.unwrapOr(await db.listWorkflowExecutions(50), []);

  // Get all recent deliveries with workflow settings via DatabaseService
  const allDeliveries = Result.unwrapOr(await db.listDeliveries(100), []);

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
        generateRecurringWorkflowId(delivery.id),
        generateWorkflowId(delivery.id, false),
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
                type: workflowId.startsWith('recurring-check-') ? 'recurring' : 'one-time',
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

  return Result.ok(workflows.slice(0, 100));
});
