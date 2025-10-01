/**
 * Start Workflow Fetcher
 * POST /api/workflow/start
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { StartWorkflowResponse } from '../types';

export async function startWorkflow(deliveryId: string): Promise<StartWorkflowResponse> {
  const url = `${apiConfig.baseUrl}/api/workflow/start`;
  return fetchJson<StartWorkflowResponse>(url, {
    method: 'POST',
    body: JSON.stringify({ deliveryId }),
  });
}
