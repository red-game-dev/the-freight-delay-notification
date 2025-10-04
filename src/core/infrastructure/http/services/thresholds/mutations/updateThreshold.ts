/**
 * Update Threshold Fetcher
 * PATCH /api/thresholds/:id
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { Threshold, UpdateThresholdInput } from "../types";

export async function updateThreshold(
  id: string,
  data: UpdateThresholdInput,
): Promise<Threshold> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/thresholds/${id}`;
  return fetchJson<Threshold>(url, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
