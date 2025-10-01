/**
 * List Workflows Fetcher
 * GET /api/workflows
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { Workflow } from '../types';

export async function listWorkflows(params?: Record<string, string>): Promise<Workflow[]> {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const url = `${env.NEXT_PUBLIC_API_URL}/api/workflows${query}`;
  return fetchJson<Workflow[]>(url);
}
