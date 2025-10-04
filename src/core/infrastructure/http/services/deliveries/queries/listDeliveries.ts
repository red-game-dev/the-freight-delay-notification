/**
 * List Deliveries Fetcher
 * GET /api/deliveries
 */

import type { PaginatedResponse } from "@/core/utils/paginationUtils";
import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { Delivery } from "../types";

export async function listDeliveries(
  params?: Record<string, string>,
): Promise<PaginatedResponse<Delivery>> {
  const query = params ? `?${new URLSearchParams(params)}` : "";
  const url = `${env.NEXT_PUBLIC_API_URL}/api/deliveries${query}`;

  return fetchJson<PaginatedResponse<Delivery>>(url);
}
