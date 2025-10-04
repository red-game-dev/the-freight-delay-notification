/**
 * Get Notification Fetcher
 * GET /api/notifications/:id
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { Notification } from "../types";

export async function getNotification(id: string): Promise<Notification> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/notifications/${id}`;
  return fetchJson<Notification>(url);
}
