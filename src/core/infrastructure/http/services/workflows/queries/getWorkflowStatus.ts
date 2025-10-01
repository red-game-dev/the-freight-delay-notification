/**
 * Get Workflow Status Fetcher
 * GET /api/workflow/status
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Workflow } from '../types';

export async function getWorkflowStatus(workflowId: string): Promise<Workflow> {
  const url = `${apiConfig.baseUrl}/api/workflow/status?workflowId=${workflowId}`;
  return fetchJson<Workflow>(url);
}
