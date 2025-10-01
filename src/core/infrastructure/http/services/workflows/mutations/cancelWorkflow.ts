/**
 * Cancel Workflow Fetcher
 * POST /api/workflows/:id/cancel
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';

export async function cancelWorkflow(input: {
  workflowId: string;
  force?: boolean;
}): Promise<void> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/workflows/${input.workflowId}/cancel`;
  return fetchJson<void>(url, {
    method: 'POST',
    body: JSON.stringify({ force: input.force }),
  });
}
