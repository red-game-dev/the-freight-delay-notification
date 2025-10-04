/**
 * Get Delivery Stats Fetcher
 * GET /api/deliveries/stats
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { DeliveryStats } from "../types";

export async function getDeliveryStats(): Promise<DeliveryStats> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/deliveries/stats`;
  return fetchJson<DeliveryStats>(url);
}
