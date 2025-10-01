/**
 * Cancel Workflow Fetcher
 * POST /api/workflows/:id/cancel
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';

export async function cancelWorkflow(workflowId: string): Promise<void> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/workflows/${workflowId}/cancel`;
  return fetchJson<void>(url, {
    method: 'POST',
  });
}
