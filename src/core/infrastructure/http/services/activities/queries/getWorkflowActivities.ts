/**
 * Get Workflow Activities Fetcher
 * GET /api/workflows/:workflowId/activities
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { WorkflowActivity } from '../types';

export async function getWorkflowActivities(workflowId: string): Promise<WorkflowActivity[]> {
  const url = `${apiConfig.baseUrl}/api/workflows/${workflowId}/activities`;
  return fetchJson<WorkflowActivity[]>(url);
}
