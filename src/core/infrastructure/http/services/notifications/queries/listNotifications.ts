/**
 * List Notifications Fetcher
 * GET /api/notifications
 */

import type { PaginatedResponse } from "@/core/utils/paginationUtils";
import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { Notification, NotificationStats } from "../types";

export interface NotificationsResponse extends PaginatedResponse<Notification> {
  stats?: NotificationStats;
}

export async function listNotifications(
  params?: Record<string, string>,
): Promise<NotificationsResponse> {
  const query = params ? `?${new URLSearchParams(params)}` : "";
  const url = `${env.NEXT_PUBLIC_API_URL}/api/notifications${query}`;
  return fetchJson<NotificationsResponse>(url);
}
