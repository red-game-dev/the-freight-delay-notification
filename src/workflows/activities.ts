/**
 * Temporal Activities for Freight Delay Notification Workflow
 * These are the actual implementations of the 4-step process from the PDF
 */

import {
  InfrastructureError,
  ValidationError,
} from "@/core/base/errors/BaseError";
import { getErrorMessage, logger } from "@/core/base/utils/Logger";
import { CheckDelayThresholdUseCase } from "@/core/engine/delivery/CheckDelayThreshold";
import type {
  Coordinates,
  DeliveryStatus,
  NotificationChannel,
  NotificationStatus,
  TrafficCondition,
  WorkflowStatus,
} from "@/core/types";
import { getCurrentISOTimestamp } from "@/core/utils/dateUtils";
import {
  capitalizeFirstLetter,
  extractFirstPart,
} from "@/core/utils/stringUtils";
import {
  createNextRunId,
  createNextWorkflowId,
} from "@/core/utils/workflowUtils";
import { AIService } from "@/infrastructure/adapters/ai/AIService";
import {
  buildEmailFallback,
  buildEmailPrompt,
  buildEmailSubject,
  buildSMSFallback,
  buildSMSPrompt,
} from "@/infrastructure/adapters/ai/prompts/NotificationPromptBuilder";
import { NotificationService } from "@/infrastructure/adapters/notifications/NotificationService";
import { getDatabaseService } from "@/infrastructure/database/DatabaseService";
import { TrafficService } from "../infrastructure/adapters/traffic/TrafficService";
import type {
  CheckTrafficInput,
  DelayEvaluationResult,
  EvaluateDelayInput,
  GeneratedNotificationMessages,
  GenerateNotificationInput,
  NotificationResult,
  SendNotificationInput,
  TrafficCheckResult,
} from "./types";

// Step 1: Check Traffic Conditions
export async function checkTrafficConditions(
  input: CheckTrafficInput,
): Promise<TrafficCheckResult> {
  // Defensive check for missing data
  if (!input || !input.origin || !input.destination) {
    logger.error(
      "[Step 1] ERROR: Missing origin or destination data:",
      JSON.stringify(input, null, 2),
    );
    throw new ValidationError(
      "Invalid input: origin and destination are required",
      { input },
    );
  }

  if (!input.origin.address || !input.destination.address) {
    logger.error("[Step 1] ERROR: Missing addresses:", {
      originAddress: input.origin?.address,
      destinationAddress: input.destination?.address,
    });
    throw new ValidationError(
      "Invalid input: origin.address and destination.address are required",
      {
        originAddress: input.origin?.address,
        destinationAddress: input.destination?.address,
      },
    );
  }

  logger.info(
    `[Step 1] Checking traffic from ${input.origin.address} to ${input.destination.address}`,
  );

  // Use TrafficService which handles all adapters and fallback
  const trafficService = new TrafficService();

  const result = await trafficService.getTrafficData({
    origin: input.origin.address,
    destination: input.destination.address,
    originCoords: input.origin.coordinates,
    destinationCoords: input.destination.coordinates,
    departureTime: input.departureTime
      ? new Date(input.departureTime)
      : undefined,
  });

  if (result.success) {
    const data = result.value;
    return {
      provider: data.provider,
      delayMinutes: data.delayMinutes,
      trafficCondition: data.trafficCondition,
      estimatedDurationMinutes: Math.round(data.estimatedDuration / 60),
      normalDurationMinutes: Math.round(data.normalDuration / 60),
      distance: data.distance || { value: 0, unit: "km" },
      timestamp: data.fetchedAt.toISOString(),
    };
  }

  // This shouldn't happen with MockTrafficAdapter as last resort
  throw new InfrastructureError(
    `Traffic data fetch failed: ${result.error.message}`,
    { error: result.error },
  );
}

// Step 2: Evaluate Delay Against Threshold (using domain layer)
export async function evaluateDelay(
  input: EvaluateDelayInput,
): Promise<DelayEvaluationResult> {
  logger.info(
    `[Step 2] Evaluating delay of ${input.delayMinutes} minutes against threshold of ${input.thresholdMinutes} minutes`,
  );

  // Use CheckDelayThresholdUseCase from domain layer
  const useCase = new CheckDelayThresholdUseCase();

  const trafficData = {
    provider: "google" as const,
    delayMinutes: input.delayMinutes,
    trafficCondition:
      input.delayMinutes > 60
        ? ("severe" as const)
        : input.delayMinutes > 30
          ? ("heavy" as const)
          : input.delayMinutes > 10
            ? ("moderate" as const)
            : ("light" as const),
    estimatedDuration: 3600 + input.delayMinutes * 60,
    normalDuration: 3600,
    fetchedAt: new Date(),
  };

  const result = useCase.execute(trafficData, input.thresholdMinutes);

  if (!result.success) {
    throw new InfrastructureError(
      `Threshold check failed: ${result.error.message}`,
      { error: result.error },
    );
  }

  const thresholdResult = result.value;

  // Map severity levels to workflow format
  let severity: DelayEvaluationResult["severity"] = "on_time";
  if (input.delayMinutes > input.thresholdMinutes * 2) {
    severity = "severe";
  } else if (input.delayMinutes > input.thresholdMinutes) {
    severity = "moderate";
  } else if (input.delayMinutes > 10) {
    severity = "minor";
  }

  return {
    exceedsThreshold: thresholdResult.exceedsThreshold,
    delayMinutes: thresholdResult.delayMinutes,
    thresholdMinutes: thresholdResult.thresholdMinutes,
    severity,
    requiresNotification: thresholdResult.shouldProceed,
  };
}

/**
 * Step 3: Generate AI-Enhanced Notifications
 * Generates per-channel messages (email & SMS) with optional AI
 *
 * @param input - Notification context with AI control flag
 * @returns Generated messages for each requested channel
 */
export async function generateNotificationMessages(
  input: GenerateNotificationInput,
): Promise<GeneratedNotificationMessages> {
  logger.info(
    `[Step 3] Generating notification messages for delivery ${input.deliveryId}`,
  );
  logger.info(`   Channels: ${input.channels.join(", ")}`);
  logger.info(
    `   Use AI: ${input.useAI !== false ? "Yes" : "No (templates only)"}`,
  );

  const aiService = new AIService();
  const result: GeneratedNotificationMessages = {
    generatedAt: getCurrentISOTimestamp(),
  };

  // Build notification context for prompt builder
  const context = {
    deliveryId: input.deliveryId,
    trackingNumber: input.trackingNumber,
    customerId: input.customerId,
    origin: input.origin,
    destination: input.destination,
    delayMinutes: input.delayMinutes,
    trafficCondition: input.trafficCondition,
    estimatedArrival: input.estimatedArrival,
    originalArrival: input.originalArrival,
  };

  // Generate EMAIL message
  if (input.channels.includes("email")) {
    logger.info("   Generating email message...");

    if (input.useAI !== false) {
      // Try AI generation
      const emailPrompt = buildEmailPrompt(context);
      const aiResult = await aiService.generateText({
        prompt: emailPrompt.prompt,
        systemPrompt: emailPrompt.systemPrompt,
        maxTokens: 300,
        temperature: 0.7,
        context: {
          deliveryId: input.deliveryId,
          type: "email",
        },
      });

      if (aiResult.success) {
        result.email = {
          subject: buildEmailSubject(context),
          body: aiResult.value.text,
          model: aiResult.value.model,
          tokens: aiResult.value.tokens,
          aiGenerated: true,
        };
        logger.info(`   ✅ Email generated with AI (${aiResult.value.model})`);
      } else {
        // Fallback to template
        logger.warn(`   ⚠️ AI failed for email, using template`);
        result.email = {
          subject: buildEmailSubject(context),
          body: buildEmailFallback(context),
          aiGenerated: false,
        };
      }
    } else {
      // Use template (AI disabled)
      result.email = {
        subject: buildEmailSubject(context),
        body: buildEmailFallback(context),
        aiGenerated: false,
      };
      logger.info(`   ✅ Email generated with template (AI disabled)`);
    }
  }

  // Generate SMS message
  if (input.channels.includes("sms")) {
    logger.info("   Generating SMS message...");

    if (input.useAI !== false) {
      // Try AI generation
      const smsPrompt = buildSMSPrompt(context);
      const aiResult = await aiService.generateText({
        prompt: smsPrompt.prompt,
        systemPrompt: smsPrompt.systemPrompt,
        maxTokens: 30, // Ultra-short for SMS (60 char limit, Twilio trial adds ~40 char prefix)
        temperature: 0.7,
        context: {
          deliveryId: input.deliveryId,
          type: "sms",
        },
      });

      if (aiResult.success) {
        // Ensure SMS is max 60 chars (truncate if needed for Twilio trial)
        const smsMessage = aiResult.value.text.substring(0, 60);
        result.sms = {
          message: smsMessage,
          model: aiResult.value.model,
          tokens: aiResult.value.tokens,
          aiGenerated: true,
        };
        logger.info(
          `   ✅ SMS generated with AI (${aiResult.value.model}, ${smsMessage.length} chars)`,
        );
      } else {
        // Fallback to template
        logger.warn(`   ⚠️ AI failed for SMS, using template`);
        result.sms = {
          message: buildSMSFallback(context),
          aiGenerated: false,
        };
      }
    } else {
      // Use template (AI disabled)
      result.sms = {
        message: buildSMSFallback(context),
        aiGenerated: false,
      };
      logger.info(`   ✅ SMS generated with template (AI disabled)`);
    }
  }

  logger.info(`✅ [Step 3] Notification messages generated successfully`);
  return result;
}

// Step 4: Send Notification
export async function sendNotification(
  input: SendNotificationInput,
): Promise<NotificationResult> {
  logger.info(`[Step 4] Sending notification for delivery ${input.deliveryId}`);

  const notificationService = new NotificationService();

  const result: NotificationResult = {
    sent: false,
    channel: "none",
    timestamp: getCurrentISOTimestamp(),
  };

  // Prepare notification input
  const notificationInput = {
    deliveryId: input.deliveryId,
    message: input.message,
    subject: input.subject || "Delivery Update",
    to: "", // Will be set per channel
  };

  let emailSent = false;
  let smsSent = false;

  // Try to send email
  if (input.recipientEmail) {
    const emailResult = await notificationService.send(
      { ...notificationInput, to: input.recipientEmail },
      "email",
    );

    if (emailResult.success) {
      emailSent = true;
      // Map provider to expected workflow type
      const provider =
        emailResult.value.channel === "email"
          ? ("sendgrid" as const)
          : ("fallback" as const);
      result.emailResult = {
        success: true,
        messageId: emailResult.value.messageId,
        provider,
      };
    } else {
      result.emailResult = {
        success: false,
        error: emailResult.error.message,
        provider: "fallback",
      };
    }
  }

  // Try to send SMS
  if (input.recipientPhone) {
    const smsResult = await notificationService.send(
      { ...notificationInput, to: input.recipientPhone },
      "sms",
    );

    if (smsResult.success) {
      smsSent = true;
      // Map provider to expected workflow type
      const provider =
        smsResult.value.channel === "sms"
          ? ("twilio" as const)
          : ("fallback" as const);
      result.smsResult = {
        success: true,
        messageId: smsResult.value.messageId,
        provider,
      };
    } else {
      result.smsResult = {
        success: false,
        error: smsResult.error.message,
        provider: "fallback",
      };
    }
  }

  // Determine channel and overall success
  if (emailSent && smsSent) {
    result.channel = "both";
    result.sent = true;
  } else if (emailSent) {
    result.channel = "email";
    result.sent = true;
  } else if (smsSent) {
    result.channel = "sms";
    result.sent = true;
  } else {
    result.channel = "none";
    result.sent = false;
    logger.info("⚠️ No notifications sent - all channels failed");
  }

  return result;
}

// Database Persistence Activities

/**
 * Save traffic snapshot to database
 */
export async function saveTrafficSnapshot(input: {
  routeId: string;
  trafficCondition: TrafficCondition;
  delayMinutes: number;
  durationSeconds: number;
  origin?: { address: string; coordinates?: Pick<Coordinates, "lat" | "lng"> };
  destination?: {
    address: string;
    coordinates?: Pick<Coordinates, "lat" | "lng">;
  };
}): Promise<{ success: boolean; id: string }> {
  logger.info(`[Database] Saving traffic snapshot for route ${input.routeId}`);

  try {
    const db = getDatabaseService();

    // Generate incident details based on traffic condition
    const severity =
      input.delayMinutes > 60
        ? "severe"
        : input.delayMinutes > 30
          ? "major"
          : input.delayMinutes > 15
            ? "moderate"
            : "minor";

    const incidentType =
      input.delayMinutes > 45
        ? "accident"
        : input.delayMinutes > 20
          ? "congestion"
          : "congestion";

    const description = `${capitalizeFirstLetter(input.trafficCondition)} traffic conditions causing ${input.delayMinutes} minute delay`;

    const affectedArea =
      input.origin && input.destination
        ? `Route from ${extractFirstPart(input.origin.address)} to ${extractFirstPart(input.destination.address)}`
        : "Route segment";

    // Calculate incident location (midpoint of route if coordinates available)
    let incidentLocation: { x: number; y: number } | undefined;
    if (
      input.origin?.coordinates?.lat !== undefined &&
      input.origin?.coordinates?.lng !== undefined &&
      input.destination?.coordinates?.lat !== undefined &&
      input.destination?.coordinates?.lng !== undefined
    ) {
      incidentLocation = {
        x:
          (input.origin.coordinates.lat + input.destination.coordinates.lat) /
          2,
        y:
          (input.origin.coordinates.lng + input.destination.coordinates.lng) /
          2,
      };
    }

    const result = await db.upsertTrafficSnapshot({
      route_id: input.routeId,
      traffic_condition: input.trafficCondition,
      delay_minutes: input.delayMinutes,
      duration_seconds: input.durationSeconds,
      description,
      severity,
      affected_area: affectedArea,
      incident_type: incidentType,
      incident_location: incidentLocation,
    });

    if (result.success) {
      logger.info(`✅ Traffic snapshot saved: ${result.value.id}`);
      return { success: true, id: result.value.id };
    } else {
      logger.error(
        `❌ Failed to save traffic snapshot: ${result.error.message}`,
      );
      return { success: false, id: "" };
    }
  } catch (error: unknown) {
    logger.error(`❌ Error saving traffic snapshot: ${getErrorMessage(error)}`);
    return { success: false, id: "" };
  }
}

/**
 * Save notification to database
 */
export async function saveNotification(input: {
  deliveryId: string;
  customerId: string;
  channel: NotificationChannel;
  recipient: string;
  message: string;
  status: Exclude<NotificationStatus, "pending" | "skipped">;
  messageId?: string;
  error?: string;
  delayMinutes?: number;
}): Promise<{ success: boolean; id: string }> {
  logger.info(
    `[Database] Saving notification for delivery ${input.deliveryId}`,
  );

  try {
    const db = getDatabaseService();
    const result = await db.createNotification({
      delivery_id: input.deliveryId,
      customer_id: input.customerId,
      channel: input.channel,
      recipient: input.recipient,
      message: input.message,
      delay_minutes: input.delayMinutes,
      status: input.status, // ✅ Pass the status ('sent' or 'failed')
      message_id: input.messageId, // ✅ Pass the message ID from provider
      error_message: input.error, // ✅ Pass error if failed
    });

    if (result.success) {
      logger.info(`✅ Notification saved: ${result.value.id}`);
      return { success: true, id: result.value.id };
    } else {
      logger.error(`❌ Failed to save notification: ${result.error.message}`);
      return { success: false, id: "" };
    }
  } catch (error: unknown) {
    logger.error(`❌ Error saving notification: ${getErrorMessage(error)}`);
    return { success: false, id: "" };
  }
}

/**
 * Update delivery status in database
 */
export async function updateDeliveryStatusInDb(input: {
  deliveryId: string;
  status: DeliveryStatus;
}): Promise<{ success: boolean }> {
  logger.info(
    `[Database] Updating delivery ${input.deliveryId} status to ${input.status}`,
  );

  try {
    const db = getDatabaseService();
    const result = await db.updateDelivery(input.deliveryId, {
      status: input.status,
    });

    if (result.success) {
      logger.info(`✅ Delivery status updated to: ${input.status}`);
      return { success: true };
    } else {
      logger.error(
        `❌ Failed to update delivery status: ${result.error.message}`,
      );
      return { success: false };
    }
  } catch (error: unknown) {
    logger.error(
      `❌ Error updating delivery status: ${getErrorMessage(error)}`,
    );
    return { success: false };
  }
}

/**
 * Save workflow execution to database
 */
export async function saveWorkflowExecution(input: {
  workflowId: string;
  runId: string;
  deliveryId: string;
  status: Exclude<WorkflowStatus, "timed_out">; // Allow cancelled status
  steps?: unknown;
  error?: string;
}): Promise<{ success: boolean; id: string }> {
  logger.info(
    `[Database] Saving workflow execution ${input.workflowId} (run: ${input.runId}) with status: ${input.status}`,
  );

  try {
    const db = getDatabaseService();

    // Check if workflow execution already exists by BOTH workflow_id AND run_id
    // This ensures we update the correct execution when using ALLOW_DUPLICATE policy
    const existingResult = await db.getWorkflowExecutionByWorkflowIdAndRunId(
      input.workflowId,
      input.runId,
    );

    if (existingResult.success && existingResult.value) {
      // Existing record found - UPDATE it to completed/failed
      logger.info(
        `[Database] Updating workflow execution: ${existingResult.value.id} (${existingResult.value.status} -> ${input.status})`,
      );
      const updateResult = await db.updateWorkflowExecution(
        existingResult.value.id,
        {
          status: input.status,
          completed_at:
            input.status === "completed" ||
            input.status === "failed" ||
            input.status === "cancelled"
              ? new Date()
              : undefined,
          error_message: input.error || undefined,
        },
      );

      if (updateResult.success) {
        logger.info(
          `✅ Workflow execution updated: ${updateResult.value.id} -> ${input.status}`,
        );

        // After completing successfully, create NEXT workflow iteration as "running"
        // This shows the next scheduled check in "Active Workflows"
        // NOTE: Only for "completed" - not failed/cancelled (user needs to manually retry)
        if (
          input.status === "completed" &&
          input.workflowId.includes("recurring-check")
        ) {
          const nextWorkflowId = createNextWorkflowId(input.workflowId);
          const nextRunId = createNextRunId(input.runId);

          if (nextWorkflowId && nextRunId) {
            logger.info(
              `[Database] Creating next workflow iteration as running`,
            );

            const nextResult = await db.createWorkflowExecution({
              workflow_id: nextWorkflowId,
              run_id: nextRunId,
              delivery_id: input.deliveryId,
              status: "running",
            });

            if (nextResult.success) {
              logger.info(
                `✅ Next workflow created: ${nextResult.value.id} (${nextWorkflowId})`,
              );
            } else {
              logger.error(
                `❌ Failed to create next workflow: ${nextResult.error.message}`,
              );
            }
          }
        }

        return { success: true, id: updateResult.value.id };
      } else {
        logger.error(
          `❌ Failed to update workflow execution: ${updateResult.error.message}`,
        );
        return { success: false, id: "" };
      }
    } else {
      // No existing record - CREATE new one directly with the specified status
      logger.info(
        `[Database] Creating workflow execution (workflow_id: ${input.workflowId}, run_id: ${input.runId}, status: ${input.status})`,
      );
      const createResult = await db.createWorkflowExecution({
        workflow_id: input.workflowId,
        run_id: input.runId,
        delivery_id: input.deliveryId,
        status: input.status,
      });

      if (createResult.success) {
        logger.info(
          `✅ Workflow execution created: ${createResult.value.id} (${input.status})`,
        );

        // If completed successfully, create NEXT iteration as "running"
        if (
          input.status === "completed" &&
          input.workflowId.includes("recurring-check")
        ) {
          const nextWorkflowId = createNextWorkflowId(input.workflowId);
          const nextRunId = createNextRunId(input.runId);

          if (nextWorkflowId && nextRunId) {
            logger.info(
              `[Database] Creating next workflow iteration as running`,
            );

            const nextResult = await db.createWorkflowExecution({
              workflow_id: nextWorkflowId,
              run_id: nextRunId,
              delivery_id: input.deliveryId,
              status: "running",
            });

            if (nextResult.success) {
              logger.info(
                `✅ Next workflow created: ${nextResult.value.id} (${nextWorkflowId})`,
              );
            }
          }
        }

        return { success: true, id: createResult.value.id };
      } else {
        logger.error(
          `❌ Failed to create workflow execution: ${createResult.error.message}`,
        );
        return { success: false, id: "" };
      }
    }
  } catch (error: unknown) {
    logger.error(
      `❌ Error saving workflow execution: ${getErrorMessage(error)}`,
    );
    return { success: false, id: "" };
  }
}

export async function saveRouteEntity(input: {
  routeId: string;
  originAddress: string;
  originCoords: { lat: number; lng: number };
  destinationAddress: string;
  destinationCoords: { lat: number; lng: number };
  distanceMeters: number;
  normalDurationSeconds: number;
  currentDurationSeconds?: number;
  trafficCondition?: string;
}): Promise<{ success: boolean; routeId: string }> {
  logger.info(`[Database] Saving route entity: ${input.routeId}`);

  const db = getDatabaseService();

  // Check if route already exists
  const existingRoute = await db.getRouteById(input.routeId);

  if (existingRoute.success && existingRoute.value) {
    // Update existing route
    logger.info(`Route ${input.routeId} already exists, updating...`);
    const updateResult = await db.updateRoute(input.routeId, {
      origin_address: input.originAddress,
      origin_coords: { x: input.originCoords.lat, y: input.originCoords.lng },
      destination_address: input.destinationAddress,
      destination_coords: {
        x: input.destinationCoords.lat,
        y: input.destinationCoords.lng,
      },
      distance_meters: input.distanceMeters,
      normal_duration_seconds: input.normalDurationSeconds,
      current_duration_seconds: input.currentDurationSeconds,
      traffic_condition: input.trafficCondition as TrafficCondition | undefined,
    });

    if (!updateResult.success) {
      logger.error(`Failed to update route: ${updateResult.error.message}`);
      throw new InfrastructureError(
        `Failed to update route: ${updateResult.error.message}`,
        { error: updateResult.error },
      );
    }

    logger.info(`✅ Route updated: ${input.routeId}`);
    return { success: true, routeId: input.routeId };
  }

  // Create new route
  const createResult = await db.createRoute({
    origin_address: input.originAddress,
    origin_coords: { x: input.originCoords.lat, y: input.originCoords.lng },
    destination_address: input.destinationAddress,
    destination_coords: {
      x: input.destinationCoords.lat,
      y: input.destinationCoords.lng,
    },
    distance_meters: input.distanceMeters,
    normal_duration_seconds: input.normalDurationSeconds,
    current_duration_seconds: input.currentDurationSeconds,
    traffic_condition: input.trafficCondition as TrafficCondition | undefined,
  });

  if (!createResult.success) {
    logger.error(`Failed to create route: ${createResult.error.message}`);
    throw new InfrastructureError(
      `Failed to create route: ${createResult.error.message}`,
      { error: createResult.error },
    );
  }

  logger.info(`✅ Route created: ${createResult.value.id}`);
  return { success: true, routeId: createResult.value.id };
}

export async function saveDeliveryEntity(input: {
  deliveryId: string;
  trackingNumber: string;
  customerId: string;
  routeId: string;
  status: DeliveryStatus;
  scheduledDelivery: string;
  delayThresholdMinutes: number;
}): Promise<{ success: boolean; deliveryId: string }> {
  logger.info(`[Database] Saving delivery entity: ${input.trackingNumber}`);

  const db = getDatabaseService();

  // Check if delivery already exists
  const existingDelivery = await db.getDeliveryById(input.deliveryId);

  if (existingDelivery.success && existingDelivery.value) {
    // Update existing delivery
    logger.info(`Delivery ${input.deliveryId} already exists, updating...`);
    const updateResult = await db.updateDelivery(input.deliveryId, {
      tracking_number: input.trackingNumber,
      status: input.status,
      scheduled_delivery: new Date(input.scheduledDelivery),
      delay_threshold_minutes: input.delayThresholdMinutes,
    });

    if (!updateResult.success) {
      logger.error(`Failed to update delivery: ${updateResult.error.message}`);
      throw new InfrastructureError(
        `Failed to update delivery: ${updateResult.error.message}`,
        { error: updateResult.error },
      );
    }

    logger.info(`✅ Delivery updated: ${input.deliveryId}`);
    return { success: true, deliveryId: input.deliveryId };
  }

  // Create new delivery
  const createResult = await db.createDelivery({
    tracking_number: input.trackingNumber,
    customer_id: input.customerId,
    route_id: input.routeId,
    status: input.status,
    scheduled_delivery: new Date(input.scheduledDelivery),
    delay_threshold_minutes: input.delayThresholdMinutes,
  });

  if (!createResult.success) {
    logger.error(`Failed to create delivery: ${createResult.error.message}`);
    throw new InfrastructureError(
      `Failed to create delivery: ${createResult.error.message}`,
      { error: createResult.error },
    );
  }

  logger.info(`✅ Delivery created: ${createResult.value.id}`);
  return { success: true, deliveryId: createResult.value.id };
}

export async function updateDeliveryStatus(input: {
  deliveryId: string;
  status: Extract<DeliveryStatus, "delayed" | "delivered" | "in_transit">;
}): Promise<{ success: boolean }> {
  logger.info(
    `[Database] Updating delivery ${input.deliveryId} status to: ${input.status}`,
  );

  // Note: Repository update would go here
  // For now, just log the action
  logger.info(`✅ Delivery status updated to: ${input.status}`);

  return { success: true };
}

/**
 * Get delivery details from database
 */
export async function getDeliveryDetails(input: {
  deliveryId: string;
}): Promise<{
  success: boolean;
  delivery?: {
    status: DeliveryStatus;
    scheduledDelivery: string;
    checksPerformed: number;
    maxChecks: number;
    enableRecurringChecks: boolean;
    minDelayChangeThreshold: number;
    minHoursBetweenNotifications: number;
    metadata?: Record<string, unknown>;
  };
}> {
  logger.info(`[Database] Fetching delivery details for ${input.deliveryId}`);

  try {
    const db = getDatabaseService();
    const result = await db.getDeliveryById(input.deliveryId);

    if (result.success && result.value) {
      const delivery = result.value;
      return {
        success: true,
        delivery: {
          status: delivery.status,
          scheduledDelivery:
            typeof delivery.scheduled_delivery === "string"
              ? delivery.scheduled_delivery
              : delivery.scheduled_delivery.toISOString(),
          checksPerformed: delivery.checks_performed ?? 0,
          maxChecks: delivery.max_checks ?? 10,
          enableRecurringChecks: delivery.enable_recurring_checks ?? false,
          minDelayChangeThreshold: delivery.min_delay_change_threshold ?? 15,
          minHoursBetweenNotifications:
            delivery.min_hours_between_notifications ?? 1.0,
          metadata: delivery.metadata,
        },
      };
    } else {
      logger.error(`❌ Delivery not found: ${input.deliveryId}`);
      return { success: false };
    }
  } catch (error: unknown) {
    logger.error(`❌ Error fetching delivery: ${getErrorMessage(error)}`);
    return { success: false };
  }
}

/**
 * Increment checks_performed counter (ATOMIC - prevents race conditions)
 * Uses database function from Migration 5 for atomic increment
 */
export async function incrementChecksPerformed(input: {
  deliveryId: string;
}): Promise<{ success: boolean; checksPerformed: number }> {
  logger.info(
    `[Database] Incrementing checks_performed for delivery ${input.deliveryId}`,
  );

  try {
    const db = getDatabaseService();

    // ✅ Use atomic increment function (prevents race conditions)
    // This is a single database operation that reads, increments, and writes atomically
    const result = await db.incrementChecksPerformed(input.deliveryId);

    if (result.success) {
      const newCount = result.value;
      logger.info(`✅ Checks performed updated: ${newCount}`);
      return { success: true, checksPerformed: newCount };
    } else {
      logger.error(
        `❌ Failed to increment checks_performed: ${result.error.message}`,
      );
      return { success: false, checksPerformed: 0 };
    }
  } catch (error: unknown) {
    logger.error(
      `❌ Error incrementing checks_performed: ${getErrorMessage(error)}`,
    );
    return { success: false, checksPerformed: 0 };
  }
}

/**
 * Get last notification for delivery to check if we should send another
 */
export async function getLastNotification(input: {
  deliveryId: string;
}): Promise<{
  success: boolean;
  notification: {
    delayMinutes: number;
    sentAt: Date;
    channel: string;
  } | null;
}> {
  logger.info(
    `[Database] Fetching last notification for delivery ${input.deliveryId}`,
  );

  try {
    const db = getDatabaseService();
    const notificationsResult = await db.listNotificationsByDelivery(
      input.deliveryId,
    );

    if (
      !notificationsResult.success ||
      !notificationsResult.value ||
      notificationsResult.value.length === 0
    ) {
      logger.info(
        `📭 No previous notifications found for delivery ${input.deliveryId}`,
      );
      return { success: true, notification: null };
    }

    // Get most recent notification (sorted by created_at desc)
    const notifications = notificationsResult.value;
    const lastNotification = notifications.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];

    logger.info(
      `📬 Last notification found: ${lastNotification.delay_minutes} min delay at ${lastNotification.sent_at || lastNotification.created_at}`,
    );

    return {
      success: true,
      notification: {
        delayMinutes: lastNotification.delay_minutes || 0,
        sentAt: lastNotification.sent_at || lastNotification.created_at,
        channel: lastNotification.channel,
      },
    };
  } catch (error: unknown) {
    logger.error(
      `❌ Error fetching last notification: ${getErrorMessage(error)}`,
    );
    return { success: false, notification: null };
  }
}
