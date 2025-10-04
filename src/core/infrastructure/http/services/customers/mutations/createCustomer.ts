/**
 * Create Customer Mutation
 * POST /api/customers
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { Customer, CreateCustomerInput } from '../types';

export async function createCustomer(data: CreateCustomerInput): Promise<Customer> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/customers`;
  const result = await fetchJson<{ customer: Customer }>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.customer;
}
