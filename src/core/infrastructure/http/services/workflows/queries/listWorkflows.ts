/**
 * List Workflows Fetcher
 * GET /api/workflows
 */

import type { PaginatedResponse } from "@/core/utils/paginationUtils";
import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { Workflow, WorkflowFilters } from "../types";

export async function listWorkflows(
  filters?: WorkflowFilters,
): Promise<PaginatedResponse<Workflow>> {
  // Convert filters to query params
  const params: Record<string, string> = {};
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params[key] = String(value);
      }
    });
  }

  const query =
    Object.keys(params).length > 0 ? `?${new URLSearchParams(params)}` : "";
  const url = `${env.NEXT_PUBLIC_API_URL}/api/workflows${query}`;
  return fetchJson<PaginatedResponse<Workflow>>(url);
}
