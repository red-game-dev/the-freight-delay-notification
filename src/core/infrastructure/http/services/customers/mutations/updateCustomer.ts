/**
 * Update Customer Mutation
 * PATCH /api/customers/:id
 */

import { fetchJson } from '../../../client/fetchJson';
import { env } from '@/infrastructure/config/EnvValidator';
import type { Customer, UpdateCustomerInput } from '../types';

export async function updateCustomer(id: string, data: UpdateCustomerInput): Promise<Customer> {
  const url = `${env.NEXT_PUBLIC_API_URL}/api/customers/${id}`;
  const result = await fetchJson<{ customer: Customer }>(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.customer;
}
