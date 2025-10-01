/**
 * Start Workflow Fetcher
 * POST /api/workflow/start
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { StartWorkflowResponse } from '../types';

export async function startWorkflow(deliveryId: string): Promise<StartWorkflowResponse> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/workflow/start`;
  return fetchJson<StartWorkflowResponse>(url, {
    method: 'POST',
    body: JSON.stringify({ deliveryId }),
  });
}
