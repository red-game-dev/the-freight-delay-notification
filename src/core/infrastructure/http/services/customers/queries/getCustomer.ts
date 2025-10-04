/**
 * Get Customer Fetcher
 * GET /api/customers/:id
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { Customer } from "../types";

export async function getCustomer(id: string): Promise<Customer> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/customers/${id}`;
  const data = await fetchJson<{ customer: Customer }>(url);
  return data.customer;
}
