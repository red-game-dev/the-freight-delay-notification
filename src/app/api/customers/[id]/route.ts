/**
 * Customer API - Individual customer operations
 * GET /api/customers/[id] - Get customer by ID
 * PATCH /api/customers/[id] - Update customer
 */

import { getDatabaseService } from '@/infrastructure/database/DatabaseService';
import { createParamApiHandler } from '@/core/infrastructure/http';
import { Result } from '@/core/base/utils/Result';
import { NotFoundError } from '@/core/base/errors/BaseError';
import { validateBody } from '@/core/utils/validation';
import { updateCustomerSchema } from '@/core/schemas/customer';
import { setAuditContext, getCustomerEmailFromRequest } from '@/app/api/middleware/auditContext';

/**
 * GET /api/customers/[id]
 * Get customer by ID - returns sanitized customer data
 */
export const GET = createParamApiHandler(async (request, { params }) => {
  await setAuditContext(request);
  const db = getDatabaseService();

  const customerResult = await db.getCustomerById(params.id);

  if (!customerResult.success || !customerResult.value) {
    return Result.fail(new NotFoundError(`Customer not found: ${params.id}`));
  }

  return Result.ok({
    customer: {
      id: customerResult.value.id,
      name: customerResult.value.name,
      email: customerResult.value.email,
      phone: customerResult.value.phone,
    }
  });
});

/**
 * PATCH /api/customers/[id]
 * Update customer - returns sanitized customer data
 */
export const PATCH = createParamApiHandler(async (request, { params }) => {
  await setAuditContext(request, await getCustomerEmailFromRequest(request));
  const db = getDatabaseService();

  // Validate request body
  const bodyResult = await validateBody(updateCustomerSchema, request);
  if (!bodyResult.success) {
    return bodyResult;
  }

  const body = bodyResult.value;

  const updateResult = await db.updateCustomer(params.id, {
    ...body,
    phone: body.phone || undefined,
  });

  if (!updateResult.success) {
    return updateResult;
  }

  return Result.ok({
    customer: {
      id: updateResult.value.id,
      name: updateResult.value.name,
      email: updateResult.value.email,
      phone: updateResult.value.phone,
    }
  });
});
