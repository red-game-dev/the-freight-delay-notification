/**
 * Create Customer Mutation
 * POST /api/customers
 */

import { env } from "@/infrastructure/config/EnvValidator";
import { fetchJson } from "../../../client/fetchJson";
import type { CreateCustomerInput, Customer } from "../types";

export async function createCustomer(
  data: CreateCustomerInput,
): Promise<Customer> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/customers`;
  const result = await fetchJson<{ customer: Customer }>(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.customer;
}
