/**
 * Get Threshold Fetcher
 * GET /api/thresholds/:id
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { Threshold } from "../types";

export async function getThreshold(id: string): Promise<Threshold> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/thresholds/${id}`;
  return fetchJson<Threshold>(url);
}
