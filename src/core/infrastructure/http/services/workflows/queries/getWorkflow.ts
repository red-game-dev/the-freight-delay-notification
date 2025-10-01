/**
 * Get Workflow Fetcher
 * GET /api/workflows/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { Workflow } from '../types';

export async function getWorkflow(id: string): Promise<Workflow> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/workflows/${id}`;
  return fetchJson<Workflow>(url);
}
