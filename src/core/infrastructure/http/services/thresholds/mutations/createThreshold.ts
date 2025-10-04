/**
 * Create Threshold Fetcher
 * POST /api/thresholds
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { CreateThresholdInput, Threshold } from "../types";

export async function createThreshold(
  data: CreateThresholdInput,
): Promise<Threshold> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/thresholds`;
  return fetchJson<Threshold>(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
