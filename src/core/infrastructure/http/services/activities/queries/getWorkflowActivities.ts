/**
 * Get Workflow Activities Fetcher
 * GET /api/workflows/:workflowId/activities
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { WorkflowActivity } from "../types";

export async function getWorkflowActivities(
  workflowId: string,
): Promise<WorkflowActivity[]> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/workflows/${workflowId}/activities`;
  return fetchJson<WorkflowActivity[]>(url);
}
