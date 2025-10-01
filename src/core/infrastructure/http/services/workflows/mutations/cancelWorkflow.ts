/**
 * Cancel Workflow Fetcher
 * POST /api/workflows/:id/cancel
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';

export async function cancelWorkflow(workflowId: string): Promise<void> {
  const url = `${apiConfig.baseUrl}/api/workflows/${workflowId}/cancel`;
  return fetchJson<void>(url, {
    method: 'POST',
  });
}
