/**
 * Create Delivery Fetcher
 * POST /api/deliveries
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { CreateDeliveryInput, Delivery } from "../types";

export async function createDelivery(
  data: CreateDeliveryInput,
): Promise<Delivery> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/deliveries`;

  return fetchJson<Delivery>(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
