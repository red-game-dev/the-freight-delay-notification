/**
 * List Workflows Fetcher
 * GET /api/workflows
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { Workflow } from '../types';
import type { PaginatedResponse } from '@/core/utils/paginationUtils';

export async function listWorkflows(params?: Record<string, string>): Promise<PaginatedResponse<Workflow>> {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${env.NEXT_PUBLIC_API_URL}/api/workflows${query}`;
  return fetchJson<PaginatedResponse<Workflow>>(url);
}
