/**
 * Get Customer By Email Fetcher
 * GET /api/customers?email=xxx
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { Customer } from '../types';

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/customers?email=${encodeURIComponent(email)}`;
  const data = await fetchJson<{ customer: Customer | null }>(url);
  return data.customer;
}
