/**
 * Workflows API Routes
 * GET /api/workflows - List all workflow executions (database + active deliveries)
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/infrastructure/config/EnvValidator';
import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createApiHandler, getQueryParam } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';
import { getTemporalClient } from '@/infrastructure/temporal/TemporalClient';

/**
 * GET /api/workflows
 * List workflow executions from both database and active deliveries
 */
export const GET = createApiHandler(async (request) => {
  const db = getDatabaseService();
  const deliveryId = getQueryParam(request, 'deliveryId');

  if (deliveryId) {
    return await db.listWorkflowExecutionsByDelivery(deliveryId);
  }

  // Get completed workflows from database
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: dbWorkflows, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50);

  if (error) {
    return Result.fail(new Error(error.message));
  }

  // Get all recent deliveries with workflow settings
  const { data: allDeliveries } = await supabase
    .from('deliveries')
    .select(`
      id,
      tracking_number,
      enable_recurring_checks,
      auto_check_traffic,
      status,
      created_at,
      check_interval_minutes,
      max_checks,
      checks_performed,
      delay_threshold_minutes,
      min_delay_change_threshold,
      min_hours_between_notifications,
      scheduled_delivery
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  // Combine and format results
  const workflows: any[] = [];

  // Add database workflows
  if (dbWorkflows) {
    workflows.push(...dbWorkflows.map(w => ({
      ...w,
      source: 'database',
    })));
  }

  // Check Temporal for running workflows for all deliveries
  if (allDeliveries) {
    const client = await getTemporalClient();

    for (const delivery of allDeliveries) {
      // Check both recurring and one-time workflow patterns
      const workflowIds = [
        `recurring-check-${delivery.id}`,
        `delay-notification-${delivery.id}`,
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
              completed_at: description.closeTime,
              source: 'temporal',
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
