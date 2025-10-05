/**
 * Temporal Workflow Definition for Freight Delay Notification
 * Implements the 4-step process as specified in the PDF
 *
 * IMPORTANT: Workflows must use console.* for logging (NOT logger)
 * Reason: Temporal workflows must be deterministic and replay-safe.
 * Using external dependencies like logger breaks determinism during replay.
 * Activities (activities.ts) can use logger since they're not replayed.
 */

import {
  ApplicationFailure,
  defineQuery,
  defineSignal,
  patched,
  proxyActivities,
  setHandler,
  sleep,
  workflowInfo,
} from "@temporalio/workflow";
import { getCurrentISOTimestamp } from "../core/utils/dateUtils";
import { createWorkflowId, WorkflowType } from "../core/utils/workflowUtils";
import {
  DATABASE_ACTIVITY_CONFIG,
  FAST_ACTIVITY_CONFIG,
} from "../infrastructure/temporal/ActivityConfig";
import type * as activities from "./activities";
import type {
  CancelNotificationSignal,
  DelayNotificationWorkflowInput,
  DelayNotificationWorkflowResult,
  RecurringCheckWorkflowInput,
  UpdateThresholdSignal,
  WorkflowStatusQuery,
} from "./types";

// Fast activities (traffic, AI, notifications)
const {
  checkTrafficConditions,
  evaluateDelay,
  generateAIMessage,
  sendNotification,
} = proxyActivities<typeof activities>(FAST_ACTIVITY_CONFIG);

// Database activities (Supabase operations with longer timeout)
const {
  saveTrafficSnapshot,
  saveNotification,
  saveWorkflowExecution,
  updateDeliveryStatusInDb,
  getDeliveryDetails,
  incrementChecksPerformed,
  getLastNotification,
} = proxyActivities<typeof activities>(DATABASE_ACTIVITY_CONFIG);

// Define signals for workflow control
export const cancelNotificationSignal =
  defineSignal<[CancelNotificationSignal]>("cancelNotification");
export const updateThresholdSignal =
  defineSignal<[UpdateThresholdSignal]>("updateThreshold");

// Define query for workflow status
export const workflowStatusQuery =
  defineQuery<WorkflowStatusQuery>("workflowStatus");

// Main workflow implementation
export async function DelayNotificationWorkflow(
  input: DelayNotificationWorkflowInput,
): Promise<DelayNotificationWorkflowResult> {
  console.log(
    `🚀 Starting Delay Notification Workflow for delivery ${input.deliveryId}`,
  );

  // Get Temporal workflow info (includes runId)
  const wfInfo = workflowInfo();

  // Initialize workflow state
  let currentStep: WorkflowStatusQuery["currentStep"] = "traffic_check";
  let canceled = false;
  let cancelReason = "";
  let thresholdMinutes = input.thresholdMinutes || 30; // Default 30 minutes as per PDF

  const result: DelayNotificationWorkflowResult = {
    workflowId: input.deliveryId,
    deliveryId: input.deliveryId,
    processedAt: getCurrentISOTimestamp(),
    steps: {},
    success: false,
  };

  // Set up signal handlers
  setHandler(cancelNotificationSignal, (signal) => {
    canceled = true;
    cancelReason = signal.reason;
    console.log(`⚠️ Workflow canceled: ${signal.reason}`);
  });

  setHandler(updateThresholdSignal, (signal) => {
    thresholdMinutes = signal.newThresholdMinutes;
    console.log(`📊 Threshold updated to ${thresholdMinutes} minutes`);
  });

  // Set up query handler
  setHandler(workflowStatusQuery, () => ({
    currentStep,
    startedAt: result.processedAt,
    lastUpdateAt: getCurrentISOTimestamp(),
    delayDetected: result.steps.delayEvaluation?.exceedsThreshold,
    notificationSent: result.steps.notificationDelivery?.sent,
  }));

  try {
    // Step 0: Get delivery details for notification preferences
    const deliveryDetailsResult = await getDeliveryDetails({
      deliveryId: input.deliveryId,
    });

    if (!deliveryDetailsResult.success || !deliveryDetailsResult.delivery) {
      console.error(`❌ Failed to fetch delivery details`);
      result.error = "Failed to fetch delivery details";
      result.success = false;
      return result;
    }

    const deliveryDetails = deliveryDetailsResult.delivery;

    // Step 1: Check Traffic Conditions
    if (!canceled) {
      currentStep = "traffic_check";
      console.log("[Workflow] Step 1: Checking traffic conditions...");

      result.steps.trafficCheck = await checkTrafficConditions({
        origin: input.origin,
        destination: input.destination,
        departureTime: input.scheduledTime,
      });

      console.log(
        `[Workflow] Traffic check complete: ${result.steps.trafficCheck.delayMinutes} minutes delay detected`,
      );

      // Save traffic snapshot to database
      await saveTrafficSnapshot({
        routeId: input.routeId,
        trafficCondition: result.steps.trafficCheck.trafficCondition,
        delayMinutes: result.steps.trafficCheck.delayMinutes,
        durationSeconds:
          result.steps.trafficCheck.estimatedDurationMinutes * 60,
        origin: input.origin,
        destination: input.destination,
      });
    }

    // Step 2: Evaluate Delay
    if (!canceled && result.steps.trafficCheck) {
      currentStep = "delay_evaluation";
      console.log("[Workflow] Step 2: Evaluating delay against threshold...");

      result.steps.delayEvaluation = await evaluateDelay({
        delayMinutes: result.steps.trafficCheck.delayMinutes,
        thresholdMinutes,
        deliveryId: input.deliveryId,
      });

      console.log(
        `[Workflow] Delay evaluation: ${result.steps.delayEvaluation.exceedsThreshold ? "EXCEEDS" : "WITHIN"} threshold`,
      );

      // Update delivery status to "delayed" if threshold exceeded
      if (result.steps.delayEvaluation.exceedsThreshold) {
        await updateDeliveryStatusInDb({
          deliveryId: input.deliveryId,
          status: "delayed",
        });
      }
    }

    // Step 3: Generate AI Message (only if threshold exceeded)
    if (!canceled && result.steps.delayEvaluation?.exceedsThreshold) {
      currentStep = "message_generation";
      console.log("[Workflow] Step 3: Generating AI notification message...");

      const estimatedArrival = new Date(
        new Date(input.scheduledTime).getTime() +
          (result.steps.trafficCheck?.delayMinutes || 0) * 60000,
      ).toISOString();

      result.steps.messageGeneration = await generateAIMessage({
        deliveryId: input.deliveryId,
        trackingNumber: input.trackingNumber,
        customerId: input.customerId,
        origin: input.origin.address,
        destination: input.destination.address,
        delayMinutes: result.steps.trafficCheck?.delayMinutes || 0,
        trafficCondition:
          result.steps.trafficCheck?.trafficCondition || "unknown",
        estimatedArrival,
        originalArrival: input.scheduledTime,
      });

      console.log("[Workflow] AI message generated successfully");
    }

    // Step 4: Send Notification (only if message was generated)
    if (!canceled && result.steps.messageGeneration) {
      currentStep = "notification_delivery";
      console.log("[Workflow] Step 4: Sending notification to customer...");

      // Get notification channel preferences from delivery metadata
      // Default to both email and SMS if not specified
      const notificationChannels = (deliveryDetails.metadata
        ?.notification_channels as ("email" | "sms")[]) || ["email", "sms"];
      const shouldSendEmail = notificationChannels.includes("email");
      const shouldSendSMS = notificationChannels.includes("sms");

      console.log(
        `[Workflow] Notification channels from settings: ${notificationChannels.join(", ")}`,
      );

      result.steps.notificationDelivery = await sendNotification({
        recipientEmail: shouldSendEmail ? input.customerEmail : undefined,
        recipientPhone: shouldSendSMS ? input.customerPhone : undefined,
        message: result.steps.messageGeneration.message,
        subject: result.steps.messageGeneration.subject,
        deliveryId: input.deliveryId,
        priority:
          result.steps.delayEvaluation?.severity === "severe"
            ? "high"
            : "normal",
      });

      console.log(
        `[Workflow] Notification sent via ${result.steps.notificationDelivery.channel}`,
      );

      // Save notifications to database
      if (
        result.steps.notificationDelivery.emailResult &&
        input.customerEmail
      ) {
        await saveNotification({
          deliveryId: input.deliveryId,
          customerId: input.customerId,
          channel: "email",
          recipient: input.customerEmail,
          message: result.steps.messageGeneration.message,
          status: result.steps.notificationDelivery.emailResult.success
            ? "sent"
            : "failed",
          messageId: result.steps.notificationDelivery.emailResult.messageId,
          error: result.steps.notificationDelivery.emailResult.error,
          delayMinutes: result.steps.trafficCheck?.delayMinutes || 0,
        });
      }

      if (result.steps.notificationDelivery.smsResult && input.customerPhone) {
        await saveNotification({
          deliveryId: input.deliveryId,
          customerId: input.customerId,
          channel: "sms",
          recipient: input.customerPhone,
          message: result.steps.messageGeneration.message,
          status: result.steps.notificationDelivery.smsResult.success
            ? "sent"
            : "failed",
          messageId: result.steps.notificationDelivery.smsResult.messageId,
          error: result.steps.notificationDelivery.smsResult.error,
          delayMinutes: result.steps.trafficCheck?.delayMinutes || 0,
        });
      }
    }

    // Determine final status
    let finalStatus: "completed" | "cancelled" = "completed";
    result.success = !canceled;

    if (canceled) {
      finalStatus = "cancelled";
      currentStep = "cancelled";
      result.error = `Workflow canceled: ${cancelReason}`;
      console.log(`❌ Workflow canceled for delivery ${input.deliveryId}`);
    } else {
      currentStep = "completed";
      if (!result.steps.delayEvaluation?.exceedsThreshold) {
        console.log(
          `✅ Workflow completed: No notification needed (delay within threshold)`,
        );
      } else {
        console.log(
          `✅ Workflow completed successfully for delivery ${input.deliveryId}`,
        );
      }
    }

    // Save workflow execution to database
    await saveWorkflowExecution({
      workflowId: createWorkflowId(
        WorkflowType.DELAY_NOTIFICATION,
        input.deliveryId,
        false,
      ),
      runId: wfInfo.runId,
      deliveryId: input.deliveryId,
      status: finalStatus,
      steps: result.steps,
      ...(canceled ? { error: result.error } : {}),
    });
  } catch (error) {
    currentStep = "failed";
    result.success = false;
    result.error =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`❌ Workflow failed: ${result.error}`);

    // Save failed workflow execution to database
    try {
      await saveWorkflowExecution({
        workflowId: createWorkflowId(
          WorkflowType.DELAY_NOTIFICATION,
          input.deliveryId,
          false,
        ),
        runId: wfInfo.runId,
        deliveryId: input.deliveryId,
        status: "failed",
        steps: result.steps,
        error: result.error,
      });
    } catch (saveError) {
      console.error(`❌ Failed to save workflow execution: ${saveError}`);
    }

    throw error;
  }

  return result;
}

/**
 * Recurring Traffic Check Workflow
 * Monitors traffic conditions at configured intervals until stop conditions are met
 */
export async function RecurringTrafficCheckWorkflow(
  input: RecurringCheckWorkflowInput,
): Promise<DelayNotificationWorkflowResult> {
  console.log(
    `🔄 Starting Recurring Traffic Check Workflow for delivery ${input.deliveryId}`,
  );
  console.log(
    `📊 Configuration: Check every ${input.checkIntervalMinutes} minutes, max ${input.maxChecks === -1 ? "unlimited" : input.maxChecks} checks`,
  );

  // Get Temporal workflow info (includes runId)
  const wfInfo = workflowInfo();

  let canceled = false;
  let cancelReason = "";
  const thresholdMinutes = input.thresholdMinutes || 30;
  let checksPerformed = 0;
  let currentStep: WorkflowStatusQuery["currentStep"] = "traffic_check";

  const result: DelayNotificationWorkflowResult = {
    workflowId: input.deliveryId,
    deliveryId: input.deliveryId,
    processedAt: getCurrentISOTimestamp(),
    steps: {},
    success: false,
  };

  // Set up signal handlers
  setHandler(cancelNotificationSignal, (signal) => {
    canceled = true;
    cancelReason = signal.reason;
    console.log(`⚠️ Recurring workflow canceled: ${signal.reason}`);
  });

  // Set up query handler
  setHandler(workflowStatusQuery, () => ({
    currentStep,
    startedAt: result.processedAt,
    lastUpdateAt: getCurrentISOTimestamp(),
    delayDetected: result.steps.delayEvaluation?.exceedsThreshold,
    notificationSent: result.steps.notificationDelivery?.sent,
  }));

  try {
    // VERSION 1 (2025-10-04): Added delivery details caching to reduce DB calls
    // Reason: Supabase timeout issues with repeated getDeliveryDetails calls in loop
    // Safe to remove after: All workflows started before 2025-10-04 are completed
    let cachedDeliveryDetails:
      | Awaited<ReturnType<typeof getDeliveryDetails>>["delivery"]
      | null = null;

    if (patched("cache-delivery-details-2025-10-04")) {
      // NEW CODE PATH: Fetch delivery details ONCE at start and cache
      console.log(`🆕 Using delivery caching (v1)`);
      const initialDetailsResult = await getDeliveryDetails({
        deliveryId: input.deliveryId,
      });

      if (!initialDetailsResult.success || !initialDetailsResult.delivery) {
        console.error(`❌ Failed to fetch initial delivery details`);
        result.error = "Failed to fetch delivery details at start";
        throw ApplicationFailure.nonRetryable(
          "Failed to fetch delivery details at workflow start",
          "DeliveryDetailsError",
        );
      }

      cachedDeliveryDetails = initialDetailsResult.delivery;
      console.log(`✅ Cached delivery details for ${input.deliveryId}`);
    } else {
      // OLD CODE PATH: No caching, fetch on demand (replaying old workflows)
      console.log(`⚠️ Replaying old workflow - no delivery caching`);
    }

    // Main recurring check loop
    while (true) {
      console.log(
        `\n🔄 Recurring check ${checksPerformed + 1}${input.maxChecks === -1 ? "" : `/${input.maxChecks}`} for delivery ${input.deliveryId}`,
      );

      // Check stop condition 1: Max checks reached (skip if unlimited)
      if (input.maxChecks !== -1 && checksPerformed >= input.maxChecks) {
        console.log(
          `✅ Recurring checks completed: ${checksPerformed}/${input.maxChecks} checks performed`,
        );
        result.success = true;
        break;
      }

      // Check stop condition 2: Manual cancellation
      if (canceled) {
        console.log(`❌ Workflow canceled: ${cancelReason}`);
        result.error = `Workflow canceled: ${cancelReason}`;
        break;
      }

      // Refresh delivery status (only status, not full details)
      const deliveryDetailsResult = await getDeliveryDetails({
        deliveryId: input.deliveryId,
      });

      // Use cached data if refresh fails (Supabase timeout protection)
      // For old workflows (no cache), this will be the first getDeliveryDetails call
      let deliveryDetails: Awaited<
        ReturnType<typeof getDeliveryDetails>
      >["delivery"];
      if (deliveryDetailsResult.success && deliveryDetailsResult.delivery) {
        deliveryDetails = deliveryDetailsResult.delivery;
        if (cachedDeliveryDetails !== null) {
          cachedDeliveryDetails = deliveryDetails; // Update cache (v1 only)
        }
      } else if (cachedDeliveryDetails !== null) {
        // V1: Use cached data if refresh fails
        deliveryDetails = cachedDeliveryDetails;
        console.warn(`⚠️ Failed to refresh delivery details, using cached data`);
      } else {
        // Old workflow: No cache, and fetch failed - must throw
        console.error(
          `❌ Failed to fetch delivery details and no cache available`,
        );
        throw ApplicationFailure.nonRetryable(
          "Failed to fetch delivery details and no cache available",
          "DeliveryDetailsError",
        );
      }

      // Check stop condition 3: Delivery status changed to terminal state
      const terminalStatuses = ["delivered", "cancelled", "failed"];
      if (terminalStatuses.includes(deliveryDetails.status)) {
        console.log(
          `✅ Delivery reached terminal status: ${deliveryDetails.status}`,
        );
        result.success = true;
        break;
      }

      // Check stop condition 4: Scheduled delivery time + cutoff has passed
      // For infinite recurring checks (-1), use configurable cutoff (default 72 hours / 3 days)
      // For finite checks, use 2 hours cutoff
      const scheduledTime = new Date(deliveryDetails.scheduledDelivery);
      const cutoffHours = input.maxChecks === -1 ? input.cutoffHours || 72 : 2;
      const cutoffTime = new Date(
        scheduledTime.getTime() + cutoffHours * 60 * 60 * 1000,
      );
      const now = new Date();

      if (now > cutoffTime) {
        console.log(
          `✅ Cutoff time reached (scheduled delivery + ${cutoffHours} hours)`,
        );
        result.success = true;
        break;
      }

      // Perform traffic check (Step 1)
      currentStep = "traffic_check";
      console.log("[Recurring] Step 1: Checking traffic conditions...");
      result.steps.trafficCheck = await checkTrafficConditions({
        origin: input.origin,
        destination: input.destination,
        departureTime: input.scheduledTime,
      });

      console.log(
        `[Recurring] Traffic check complete: ${result.steps.trafficCheck.delayMinutes} minutes delay detected`,
      );

      // Save traffic snapshot
      await saveTrafficSnapshot({
        routeId: input.routeId,
        trafficCondition: result.steps.trafficCheck.trafficCondition,
        delayMinutes: result.steps.trafficCheck.delayMinutes,
        durationSeconds:
          result.steps.trafficCheck.estimatedDurationMinutes * 60,
        origin: input.origin,
        destination: input.destination,
      });

      // Evaluate delay (Step 2)
      currentStep = "delay_evaluation";
      console.log("[Recurring] Step 2: Evaluating delay against threshold...");
      result.steps.delayEvaluation = await evaluateDelay({
        delayMinutes: result.steps.trafficCheck.delayMinutes,
        thresholdMinutes,
        deliveryId: input.deliveryId,
      });

      console.log(
        `[Recurring] Delay evaluation: ${result.steps.delayEvaluation.exceedsThreshold ? "EXCEEDS" : "WITHIN"} threshold`,
      );

      // Track if we saved this check to DB (to avoid double-saving)
      let savedToDB = false;

      // Only notify if threshold exceeded
      if (result.steps.delayEvaluation.exceedsThreshold) {
        console.log(
          `⚠️ Delay exceeds threshold (${result.steps.trafficCheck.delayMinutes} > ${thresholdMinutes}), checking if notification needed...`,
        );

        // Check last notification to avoid spam
        const lastNotificationResult = await getLastNotification({
          deliveryId: input.deliveryId,
        });
        let shouldNotify = false;

        if (
          !lastNotificationResult.success ||
          !lastNotificationResult.notification
        ) {
          // No previous notification - this is the first one
          shouldNotify = true;
          console.log(`📢 First notification for this delivery - will notify`);
        } else {
          const lastNotif = lastNotificationResult.notification;
          const currentDelay = result.steps.trafficCheck.delayMinutes;
          const lastDelay = lastNotif.delayMinutes;
          const delayChange = Math.abs(currentDelay - lastDelay);
          const timeSinceLastNotif =
            Date.now() - new Date(lastNotif.sentAt).getTime();
          const hoursSinceLastNotif = timeSinceLastNotif / (1000 * 60 * 60);

          // Notification deduplication rules - use delivery-specific settings
          // 1. Delay changed significantly (configurable threshold)
          // 2. OR sufficient time has passed since last notification (configurable hours)
          const minDelayChangeThreshold =
            deliveryDetails.minDelayChangeThreshold || 15; // minutes
          const minHoursBetweenNotifications =
            deliveryDetails.minHoursBetweenNotifications || 1.0; // hours

          if (delayChange >= minDelayChangeThreshold) {
            shouldNotify = true;
            console.log(
              `📢 Delay changed significantly (${lastDelay}min → ${currentDelay}min, Δ=${delayChange}min >= ${minDelayChangeThreshold}min) - will notify`,
            );
          } else if (hoursSinceLastNotif >= minHoursBetweenNotifications) {
            shouldNotify = true;
            console.log(
              `📢 Sufficient time passed (${hoursSinceLastNotif.toFixed(1)}h >= ${minHoursBetweenNotifications}h since last notification) - will notify`,
            );
          } else {
            shouldNotify = false;
            console.log(
              `🔕 Skipping notification - delay change (Δ=${delayChange}min < ${minDelayChangeThreshold}min) and only ${hoursSinceLastNotif.toFixed(1)}h (< ${minHoursBetweenNotifications}h) since last notification`,
            );
          }
        }

        if (shouldNotify) {
          console.log(`📨 Proceeding with notification...`);

          // Update delivery status to "delayed"
          await updateDeliveryStatusInDb({
            deliveryId: input.deliveryId,
            status: "delayed",
          });

          // Generate AI message (Step 3)
          currentStep = "message_generation";
          console.log(
            "[Recurring] Step 3: Generating AI notification message...",
          );
          const estimatedArrival = new Date(
            new Date(input.scheduledTime).getTime() +
              result.steps.trafficCheck.delayMinutes * 60000,
          ).toISOString();

          result.steps.messageGeneration = await generateAIMessage({
            deliveryId: input.deliveryId,
            trackingNumber: input.trackingNumber,
            customerId: input.customerId,
            origin: input.origin.address,
            destination: input.destination.address,
            delayMinutes: result.steps.trafficCheck.delayMinutes,
            trafficCondition: result.steps.trafficCheck.trafficCondition,
            estimatedArrival,
            originalArrival: input.scheduledTime,
          });

          console.log("[Recurring] AI message generated successfully");

          // Send notification (Step 4)
          currentStep = "notification_delivery";
          console.log(
            "[Recurring] Step 4: Sending notification to customer...",
          );

          // Get notification channel preferences from delivery metadata
          // Default to both email and SMS if not specified
          const notificationChannels = (deliveryDetails.metadata
            ?.notification_channels as ("email" | "sms")[]) || ["email", "sms"];
          const shouldSendEmail = notificationChannels.includes("email");
          const shouldSendSMS = notificationChannels.includes("sms");

          console.log(
            `[Recurring] Notification channels from settings: ${notificationChannels.join(", ")}`,
          );

          result.steps.notificationDelivery = await sendNotification({
            recipientEmail: shouldSendEmail ? input.customerEmail : undefined,
            recipientPhone: shouldSendSMS ? input.customerPhone : undefined,
            message: result.steps.messageGeneration.message,
            subject: result.steps.messageGeneration.subject,
            deliveryId: input.deliveryId,
            priority:
              result.steps.delayEvaluation.severity === "severe"
                ? "high"
                : "normal",
          });

          console.log(
            `[Recurring] Notification sent via ${result.steps.notificationDelivery.channel}`,
          );

          // Save notifications to database
          if (
            result.steps.notificationDelivery.emailResult &&
            input.customerEmail
          ) {
            await saveNotification({
              deliveryId: input.deliveryId,
              customerId: input.customerId,
              channel: "email",
              recipient: input.customerEmail,
              message: result.steps.messageGeneration.message,
              status: result.steps.notificationDelivery.emailResult.success
                ? "sent"
                : "failed",
              messageId:
                result.steps.notificationDelivery.emailResult.messageId,
              error: result.steps.notificationDelivery.emailResult.error,
              delayMinutes: result.steps.trafficCheck.delayMinutes,
            });
          }

          if (
            result.steps.notificationDelivery.smsResult &&
            input.customerPhone
          ) {
            await saveNotification({
              deliveryId: input.deliveryId,
              customerId: input.customerId,
              channel: "sms",
              recipient: input.customerPhone,
              message: result.steps.messageGeneration.message,
              status: result.steps.notificationDelivery.smsResult.success
                ? "sent"
                : "failed",
              messageId: result.steps.notificationDelivery.smsResult.messageId,
              error: result.steps.notificationDelivery.smsResult.error,
              delayMinutes: result.steps.trafficCheck.delayMinutes,
            });
          }

          // Save workflow execution for this check iteration
          // This creates a completed workflow record for each notification sent
          // Gives users visibility into each check cycle
          try {
            await saveWorkflowExecution({
              workflowId: createWorkflowId(
                WorkflowType.RECURRING_CHECK,
                input.deliveryId,
                true,
                checksPerformed + 1,
              ),
              runId: `${wfInfo.runId}-check-${checksPerformed + 1}`,
              deliveryId: input.deliveryId,
              status: "completed",
              steps: {
                checkNumber: checksPerformed + 1,
                trafficCheck: result.steps.trafficCheck,
                delayEvaluation: result.steps.delayEvaluation,
                messageGeneration: result.steps.messageGeneration,
                notificationDelivery: result.steps.notificationDelivery,
              },
            });
            console.log(
              `✅ Saved workflow execution for check #${checksPerformed + 1}`,
            );
            savedToDB = true;
          } catch (saveError) {
            console.error(
              `❌ Failed to save workflow execution for check #${checksPerformed + 1}:`,
              saveError,
            );
            // Don't fail the workflow if save fails - just log and continue
          }
        } else {
          console.log(
            `⏭️ Skipping notification for this check (deduplication rules)`,
          );

          // Save workflow execution even when notification is skipped
          try {
            await saveWorkflowExecution({
              workflowId: createWorkflowId(
                WorkflowType.RECURRING_CHECK,
                input.deliveryId,
                true,
                checksPerformed + 1,
              ),
              runId: `${wfInfo.runId}-check-${checksPerformed + 1}`,
              deliveryId: input.deliveryId,
              status: "completed",
              steps: {
                checkNumber: checksPerformed + 1,
                trafficCheck: result.steps.trafficCheck,
                delayEvaluation: result.steps.delayEvaluation,
                messageGeneration: result.steps.messageGeneration,
                // Notification was skipped due to deduplication
                notificationSkipped: true,
              },
            });
            console.log(
              `✅ Saved workflow execution for check #${checksPerformed + 1} (notification skipped)`,
            );
            savedToDB = true;
          } catch (saveError) {
            console.error(
              `❌ Failed to save workflow execution for check #${checksPerformed + 1}:`,
              saveError,
            );
          }
        }
      } else {
        console.log(
          `✅ No notification needed - delay within threshold (${result.steps.trafficCheck.delayMinutes} ≤ ${thresholdMinutes})`,
        );
      }

      // Save workflow execution for ALL checks (not just notifications)
      // This gives users visibility into every traffic check performed
      if (!savedToDB) {
        // Only save if we didn't already save above (in the shouldNotify block)
        try {
          await saveWorkflowExecution({
            workflowId: createWorkflowId(
              WorkflowType.RECURRING_CHECK,
              input.deliveryId,
              true,
              checksPerformed + 1,
            ),
            runId: `${wfInfo.runId}-check-${checksPerformed + 1}`,
            deliveryId: input.deliveryId,
            status: "completed",
            steps: {
              checkNumber: checksPerformed + 1,
              trafficCheck: result.steps.trafficCheck,
              delayEvaluation: result.steps.delayEvaluation,
              // No notification sent for this check
            },
          });
          console.log(
            `✅ Saved workflow execution for check #${checksPerformed + 1} (no notification)`,
          );
        } catch (saveError) {
          console.error(
            `❌ Failed to save workflow execution for check #${checksPerformed + 1}:`,
            saveError,
          );
          // Don't fail the workflow if save fails - just log and continue
        }
      }

      // Increment checks_performed counter
      const incrementResult = await incrementChecksPerformed({
        deliveryId: input.deliveryId,
      });

      if (incrementResult.success) {
        checksPerformed = incrementResult.checksPerformed;
        console.log(
          `✅ Checks performed: ${checksPerformed}${input.maxChecks === -1 ? "" : `/${input.maxChecks}`}`,
        );
      }

      // Check if this was the last check (skip if unlimited)
      if (input.maxChecks !== -1 && checksPerformed >= input.maxChecks) {
        console.log(
          `✅ Max checks reached: ${checksPerformed}/${input.maxChecks}`,
        );
        result.success = true;
        break;
      }

      // Sleep for the configured interval
      const sleepDurationMs = input.checkIntervalMinutes * 60 * 1000;
      console.log(`⏸️  Sleeping for ${input.checkIntervalMinutes} minutes...`);
      await sleep(sleepDurationMs);
    }

    // Determine final workflow status
    let finalStatus: "completed" | "cancelled" = "completed";
    let finalReason = "Workflow completed naturally";

    if (canceled) {
      finalStatus = "cancelled";
      finalReason = cancelReason || "Workflow cancelled by user";
      currentStep = "cancelled";
      console.log(`🛑 Workflow cancelled: ${finalReason}`);
    } else {
      currentStep = "completed";
      finalReason = checksPerformed >= input.maxChecks
        ? `Max checks reached (${checksPerformed}/${input.maxChecks})`
        : "Cutoff time reached or delivery terminal status";
    }

    // Update delivery status when workflow completes (only if not cancelled)
    if (!canceled) {
      const finalDeliveryResult = await getDeliveryDetails({
        deliveryId: input.deliveryId,
      });
      if (finalDeliveryResult.success && finalDeliveryResult.delivery) {
        const currentStatus = finalDeliveryResult.delivery.status;
        const terminalStatuses = ["delivered", "cancelled", "failed"];

        if (!terminalStatuses.includes(currentStatus)) {
          // If workflow completed due to cutoff time being reached, mark as in_transit
          // Unless it's already marked as delayed
          if (currentStatus !== "delayed") {
            await updateDeliveryStatusInDb({
              deliveryId: input.deliveryId,
              status: "in_transit",
            });
            console.log(
              `✅ Updated delivery status to 'in_transit' as workflow completed`,
            );
          }
        }
      }
    }

    // Save final summary workflow execution
    // This represents the entire recurring workflow completion (all checks)
    // Individual check executions are saved after each notification
    await saveWorkflowExecution({
      workflowId: createWorkflowId(
        WorkflowType.RECURRING_CHECK,
        input.deliveryId,
        false,
      ),
      runId: wfInfo.runId,
      deliveryId: input.deliveryId,
      status: finalStatus,
      steps: {
        checksPerformed,
        totalChecks: checksPerformed,
        reason: finalReason,
        ...result.steps,
      },
      ...(canceled ? { error: finalReason } : {}),
    });
  } catch (error) {
    currentStep = "failed";
    result.success = false;
    result.error =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`❌ Recurring workflow failed: ${result.error}`);

    // Save failed workflow execution (best effort - don't let this fail the workflow)
    // Note: If Supabase is down (522 errors), this will fail but workflow continues
    // Failed workflows will still be visible in Temporal UI even if not saved to DB
    try {
      await saveWorkflowExecution({
        workflowId: createWorkflowId(
          WorkflowType.RECURRING_CHECK,
          input.deliveryId,
          false,
        ),
        runId: wfInfo.runId,
        deliveryId: input.deliveryId,
        status: "failed",
        steps: { checksPerformed, ...result.steps },
        error: result.error,
      });
      console.log(`✅ Failed workflow status saved to database`);
    } catch (saveError) {
      console.error(
        `⚠️ Could not save failed workflow to database (DB may be down): ${saveError}`,
      );
      console.error(
        `   Workflow failure is still recorded in Temporal and will be visible there`,
      );
    }

    throw error;
  }

  return result;
}
