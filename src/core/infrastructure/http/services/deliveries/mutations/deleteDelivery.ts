/**
 * Delete Delivery Fetcher
 * DELETE /api/deliveries/:id
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";

export async function deleteDelivery(id: string): Promise<void> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/deliveries/${id}`;

  return fetchJson<void>(url, {
    method: "DELETE",
  });
}
