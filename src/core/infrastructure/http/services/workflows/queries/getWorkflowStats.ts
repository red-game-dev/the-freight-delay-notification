/**
 * Get Workflow Stats Fetcher
 * GET /api/workflows/stats
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { WorkflowStats } from "../types";

export async function getWorkflowStats(): Promise<WorkflowStats> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/workflows/stats`;
  return fetchJson<WorkflowStats>(url);
}
