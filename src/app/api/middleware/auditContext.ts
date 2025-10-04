/**
 * Audit Context Middleware
 * Sets audit context for tracking database changes
 * Must be called at the start of each API route for compliance
 *
 * NOTE: This app has NO AUTHENTICATION
 * - Customers are created when deliveries are created/edited
 * - Customer ID can be queried by email if needed
 * - Audit tracking uses 'system' or customer email from request body
 */

import type { NextRequest } from "next/server";
import { generateId } from "@/core/utils/idUtils";
import { getDatabaseService } from "@/infrastructure/database/DatabaseService";

/**
 * Set audit context for the current request
 * This ensures all database changes are tracked with request ID
 *
 * @param request - Next.js request object
 * @param customerEmail - Optional customer email from request (for tracking who made changes)
 */
export async function setAuditContext(
  request: NextRequest,
  customerEmail?: string,
): Promise<void> {
  try {
    const db = getDatabaseService();

    // Get or generate request ID for tracing
    const requestId =
      request.headers.get("x-request-id") ||
      request.headers.get("x-vercel-id") ||
      generateId();

    // Use customer email as audit user, or 'system' for internal operations
    const auditUser = customerEmail || "system";

    // Set audit context in database
    await db.setAuditContext(auditUser, requestId);
  } catch (error) {
    // Don't fail the request if audit context fails
    // Just log it for debugging
    console.error("[Audit Context] Failed to set audit context:", error);
  }
}

/**
 * Extract customer email from request body (for audit tracking)
 * Used to track which customer made changes to their deliveries
 */
export async function getCustomerEmailFromRequest(
  request: NextRequest,
): Promise<string | undefined> {
  try {
    // Clone request to read body without consuming it
    const clonedRequest = request.clone();
    const body = await clonedRequest.json();

    // Check common fields where customer email might be
    return (
      body?.customer_email || body?.email || body?.customerEmail || undefined
    );
  } catch (error) {
    // Body might not be JSON or might already be consumed
    return undefined;
  }
}

/**
 * Helper to get customer ID by email
 * Use this when you need to track actions by a specific customer
 */
export async function getCustomerIdByEmail(
  email: string,
): Promise<string | null> {
  try {
    const db = getDatabaseService();
    const result = await db.getCustomerByEmail(email);

    if (result.success && result.value) {
      return result.value.id;
    }
    return null;
  } catch (error) {
    console.error("[Audit Context] Failed to get customer by email:", error);
    return null;
  }
}
