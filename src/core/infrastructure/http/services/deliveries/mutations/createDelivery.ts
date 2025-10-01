/**
 * Create Delivery Fetcher
 * POST /api/deliveries
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { Delivery, CreateDeliveryInput } from '../types';

export async function createDelivery(data: CreateDeliveryInput): Promise<Delivery> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/deliveries`;

  return fetchJson<Delivery>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
