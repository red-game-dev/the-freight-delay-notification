/**
 * Customers API
 * GET /api/customers?email=xxx - Get customer by email
 * POST /api/customers - Create customer
 */

import {
  getCustomerEmailFromRequest,
  setAuditContext,
} from "@/app/api/middleware/auditContext";
import { Result } from "@/core/base/utils/Result";
import { createApiHandler } from "@/core/infrastructure/http";
import {
  createCustomerSchema,
  customerEmailQuerySchema,
} from "@/core/schemas/customer";
import { validateBody, validateQuery } from "@/core/utils/validation";
import { getDatabaseService } from "@/infrastructure/database/DatabaseService";

/**
 * GET /api/customers?email=xxx
 * Get customer by email - returns sanitized customer data
 */
export const GET = createApiHandler(async (request) => {
  await setAuditContext(request);
  const db = getDatabaseService();

  // Validate query parameters
  const queryResult = validateQuery(customerEmailQuerySchema, request);
  if (!queryResult.success) {
    return queryResult;
  }

  const { email } = queryResult.value;

  const customerResult = await db.getCustomerByEmail(email);

  if (!customerResult.success) {
    return customerResult;
  }

  // Return only safe fields
  return Result.ok({
    customer: customerResult.value
      ? {
          id: customerResult.value.id,
          name: customerResult.value.name,
          email: customerResult.value.email,
          phone: customerResult.value.phone,
        }
      : null,
  });
});

/**
 * POST /api/customers
 * Create a new customer (or return existing if email already exists) - returns sanitized customer data
 */
export const POST = createApiHandler(
  async (request) => {
    await setAuditContext(request, await getCustomerEmailFromRequest(request));
    const db = getDatabaseService();

    // Validate request body
    const bodyResult = await validateBody(createCustomerSchema, request);
    if (!bodyResult.success) {
      return bodyResult;
    }

    const body = bodyResult.value;

    // Check if customer already exists
    const existingCustomer = await db.getCustomerByEmail(body.email);

    if (existingCustomer.success && existingCustomer.value) {
      // Customer exists - update if details changed
      const needsUpdate =
        existingCustomer.value.name !== body.name ||
        existingCustomer.value.phone !== body.phone;

      if (needsUpdate) {
        const updateResult = await db.updateCustomer(
          existingCustomer.value.id,
          {
            name: body.name,
            phone: body.phone || undefined,
          },
        );

        if (!updateResult.success) {
          return updateResult;
        }

        return Result.ok({
          customer: {
            id: updateResult.value.id,
            name: updateResult.value.name,
            email: updateResult.value.email,
            phone: updateResult.value.phone,
          },
        });
      }

      // No update needed, return existing customer
      return Result.ok({
        customer: {
          id: existingCustomer.value.id,
          name: existingCustomer.value.name,
          email: existingCustomer.value.email,
          phone: existingCustomer.value.phone,
        },
      });
    }

    // Customer doesn't exist - create new
    const createResult = await db.createCustomer({
      name: body.name,
      email: body.email,
      phone: body.phone || undefined,
    });

    if (!createResult.success) {
      return createResult;
    }

    return Result.ok({
      customer: {
        id: createResult.value.id,
        name: createResult.value.name,
        email: createResult.value.email,
        phone: createResult.value.phone,
      },
    });
  },
  { successStatus: 201 },
);
