/**
 * Get Workflow Status Fetcher
 * GET /api/workflow/status
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { Workflow } from "../types";

export async function getWorkflowStatus(workflowId: string): Promise<Workflow> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/workflow/status?workflowId=${workflowId}`;
  return fetchJson<Workflow>(url);
}
