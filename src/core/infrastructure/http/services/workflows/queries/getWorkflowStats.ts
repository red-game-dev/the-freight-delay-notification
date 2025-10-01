/**
 * Get Workflow Stats Fetcher
 * GET /api/workflows/stats
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { WorkflowStats } from '../types';

export async function getWorkflowStats(): Promise<WorkflowStats> {
  const url = `${apiConfig.baseUrl}/api/workflows/stats`;
  return fetchJson<WorkflowStats>(url);
}
