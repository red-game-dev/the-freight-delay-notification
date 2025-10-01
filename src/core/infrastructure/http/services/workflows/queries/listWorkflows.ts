/**
 * List Workflows Fetcher
 * GET /api/workflows
 */

import { fetchJson } from '../../../client/fetchJson';
import { apiConfig } from '../../../config';
import type { Workflow } from '../types';

export async function listWorkflows(params?: Record<string, string>): Promise<Workflow[]> {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${apiConfig.baseUrl}/api/workflows${query}`;
  return fetchJson<Workflow[]>(url);
}
