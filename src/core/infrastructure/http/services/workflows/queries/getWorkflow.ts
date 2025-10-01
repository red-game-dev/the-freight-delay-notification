/**
 * Get Workflow Fetcher
 * GET /api/workflows/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Workflow } from '../types';

export async function getWorkflow(id: string): Promise<Workflow> {
  const url = `${apiConfig.baseUrl}/api/workflows/${id}`;
  return fetchJson<Workflow>(url);
}
