/**
 * Get Notification Stats Fetcher
 * GET /api/notifications/stats
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { NotificationStats } from "../types";

export async function getNotificationStats(): Promise<NotificationStats> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/notifications/stats`;
  return fetchJson<NotificationStats>(url);
}
