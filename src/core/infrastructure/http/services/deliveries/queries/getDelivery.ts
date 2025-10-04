/**
 * Get Delivery Fetcher
 * GET /api/deliveries/:id
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { Delivery } from "../types";

export async function getDelivery(id: string): Promise<Delivery> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/deliveries/${id}`;
  return fetchJson<Delivery>(url);
}
