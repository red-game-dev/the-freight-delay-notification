/**
 * Cancel Workflow API
 * POST /api/workflows/:id/cancel - Cancel a running workflow
 * Body: { force?: boolean } - If true, terminates instead of graceful cancel
 */

import {
  getCustomerEmailFromRequest,
  setAuditContext,
} from "@/app/api/middleware/auditContext";
import { InfrastructureError } from "@/core/base/errors/BaseError";
import { getErrorMessage, hasMessage, logger } from "@/core/base/utils/Logger";
import { Result, success } from "@/core/base/utils/Result";
import { createParamApiHandler } from "@/core/infrastructure/http";
import { cancelWorkflowSchema } from "@/core/schemas/workflow";
import { validateBody } from "@/core/utils/validation";
import { getDatabaseService } from "@/infrastructure/database/DatabaseService";
import { getTemporalClient } from "@/infrastructure/temporal/TemporalClient";

export const POST = createParamApiHandler(async (request, context) => {
  await setAuditContext(request, await getCustomerEmailFromRequest(request));
  const params = await context.params;
  const workflowId = params.id;

  // Validate request body (force and reason are optional)
  const bodyResult = await validateBody(
    cancelWorkflowSchema.partial(),
    request,
  );
  const force = bodyResult.success ? (bodyResult.value.force ?? false) : false;

  try {
    const client = await getTemporalClient();
    const db = getDatabaseService();

    // Get workflow handle
    const handle = client.workflow.getHandle(workflowId);

    if (force) {
      // Force terminate the workflow immediately
      await handle.terminate("Force terminated by user");
      logger.info(`✅ Workflow ${workflowId} force terminated by user request`);
    } else {
      // Graceful cancel via signal
      await handle.cancel();
      logger.info(`✅ Workflow ${workflowId} canceled by user request`);
    }

    // Update workflow execution status in database
    const workflowResult =
      await db.getWorkflowExecutionByWorkflowId(workflowId);
    if (workflowResult.success && workflowResult.value) {
      await db.updateWorkflowExecution(workflowResult.value.id, {
        status: "cancelled",
        completed_at: new Date(),
      });
      logger.info(
        `📝 Updated workflow execution status to 'cancelled' in database`,
      );
    }

    return success({
      message: force
        ? "Workflow terminated successfully"
        : "Workflow canceled successfully",
      workflowId,
      forced: force,
    });
  } catch (error: unknown) {
    logger.error(
      `❌ Failed to ${force ? "terminate" : "cancel"} workflow ${workflowId}:`,
      error,
    );

    // If workflow doesn't exist or already completed, return success
    if (
      (hasMessage(error) && error.message.includes("not found")) ||
      (hasMessage(error) && error.message.includes("already completed"))
    ) {
      return success({
        message: "Workflow already completed or does not exist",
        workflowId,
      });
    }

    return Result.fail(
      new InfrastructureError(
        `Failed to ${force ? "terminate" : "cancel"} workflow: ${getErrorMessage(error)}`,
        { cause: error },
      ),
    );
  }
});
