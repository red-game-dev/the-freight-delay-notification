/**
 * Temporal Workflow Definition for Freight Delay Notification
 * Implements the 4-step process as specified in the PDF
 */

import { proxyActivities, defineSignal, defineQuery, setHandler, sleep } from '@temporalio/workflow';
import type * as activities from './activities';
import type {
  DelayNotificationWorkflowInput,
  DelayNotificationWorkflowResult,
  RecurringCheckWorkflowInput,
  CancelNotificationSignal,
  UpdateThresholdSignal,
  WorkflowStatusQuery,
} from './types';

// Import all activities with retry policies and timeouts
const {
  checkTrafficConditions,
  evaluateDelay,
  generateAIMessage,
  sendNotification,
  saveTrafficSnapshot,
  saveNotification,
  saveWorkflowExecution,
  updateDeliveryStatusInDb,
  getDeliveryDetails,
  incrementChecksPerformed,
  getLastNotification,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    initialInterval: '5s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
    maximumInterval: '30s',
  },
});

// Define signals for workflow control
export const cancelNotificationSignal = defineSignal<[CancelNotificationSignal]>('cancelNotification');
export const updateThresholdSignal = defineSignal<[UpdateThresholdSignal]>('updateThreshold');

// Define query for workflow status
export const workflowStatusQuery = defineQuery<WorkflowStatusQuery>('workflowStatus');

// Main workflow implementation
export async function DelayNotificationWorkflow(
  input: DelayNotificationWorkflowInput
): Promise<DelayNotificationWorkflowResult> {
  console.log(`🚀 Starting Delay Notification Workflow for delivery ${input.deliveryId}`);

  // Initialize workflow state
  let currentStep: WorkflowStatusQuery['currentStep'] = 'traffic_check';
  let canceled = false;
  let cancelReason = '';
  let thresholdMinutes = input.thresholdMinutes || 30; // Default 30 minutes as per PDF

  const result: DelayNotificationWorkflowResult = {
    workflowId: input.deliveryId,
    deliveryId: input.deliveryId,
    processedAt: new Date().toISOString(),
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
    lastUpdateAt: new Date().toISOString(),
    delayDetected: result.steps.delayEvaluation?.exceedsThreshold,
    notificationSent: result.steps.notificationDelivery?.sent,
  }));

  try {
    // Step 1: Check Traffic Conditions
    if (!canceled) {
      currentStep = 'traffic_check';
      console.log('[Workflow] Step 1: Checking traffic conditions...');

      result.steps.trafficCheck = await checkTrafficConditions({
        origin: input.origin,
        destination: input.destination,
        departureTime: input.scheduledTime,
      });

      console.log(`[Workflow] Traffic check complete: ${result.steps.trafficCheck.delayMinutes} minutes delay detected`);

      // Save traffic snapshot to database
      await saveTrafficSnapshot({
        routeId: input.routeId,
        trafficCondition: result.steps.trafficCheck.trafficCondition,
        delayMinutes: result.steps.trafficCheck.delayMinutes,
        durationSeconds: result.steps.trafficCheck.estimatedDurationMinutes * 60,
      });
    }

    // Step 2: Evaluate Delay
    if (!canceled && result.steps.trafficCheck) {
      currentStep = 'delay_evaluation';
      console.log('[Workflow] Step 2: Evaluating delay against threshold...');

      result.steps.delayEvaluation = await evaluateDelay({
        delayMinutes: result.steps.trafficCheck.delayMinutes,
        thresholdMinutes,
        deliveryId: input.deliveryId,
      });

      console.log(`[Workflow] Delay evaluation: ${result.steps.delayEvaluation.exceedsThreshold ? 'EXCEEDS' : 'WITHIN'} threshold`);

      // Update delivery status to "delayed" if threshold exceeded
      if (result.steps.delayEvaluation.exceedsThreshold) {
        await updateDeliveryStatusInDb({
          deliveryId: input.deliveryId,
          status: 'delayed',
        });
      }
    }

    // Step 3: Generate AI Message (only if threshold exceeded)
    if (!canceled && result.steps.delayEvaluation?.exceedsThreshold) {
      currentStep = 'message_generation';
      console.log('[Workflow] Step 3: Generating AI notification message...');

      const estimatedArrival = new Date(new Date(input.scheduledTime).getTime() +
        (result.steps.trafficCheck?.delayMinutes || 0) * 60000).toISOString();

      result.steps.messageGeneration = await generateAIMessage({
        deliveryId: input.deliveryId,
        customerId: input.customerId,
        origin: input.origin.address,
        destination: input.destination.address,
        delayMinutes: result.steps.trafficCheck?.delayMinutes || 0,
        trafficCondition: result.steps.trafficCheck?.trafficCondition || 'unknown',
        estimatedArrival,
        originalArrival: input.scheduledTime,
      });

      console.log('[Workflow] AI message generated successfully');
    }

    // Step 4: Send Notification (only if message was generated)
    if (!canceled && result.steps.messageGeneration) {
      currentStep = 'notification_delivery';
      console.log('[Workflow] Step 4: Sending notification to customer...');

      result.steps.notificationDelivery = await sendNotification({
        recipientEmail: input.customerEmail,
        recipientPhone: input.customerPhone,
        message: result.steps.messageGeneration.message,
        subject: result.steps.messageGeneration.subject,
        deliveryId: input.deliveryId,
        priority: result.steps.delayEvaluation?.severity === 'severe' ? 'high' : 'normal',
      });

      console.log(`[Workflow] Notification sent via ${result.steps.notificationDelivery.channel}`);

      // Save notifications to database
      if (result.steps.notificationDelivery.emailResult && input.customerEmail) {
        await saveNotification({
          deliveryId: input.deliveryId,
          customerId: input.customerId,
          channel: 'email',
          recipient: input.customerEmail,
          message: result.steps.messageGeneration.message,
          status: result.steps.notificationDelivery.emailResult.success ? 'sent' : 'failed',
          messageId: result.steps.notificationDelivery.emailResult.messageId,
          error: result.steps.notificationDelivery.emailResult.error,
          delayMinutes: result.steps.trafficCheck?.delayMinutes || 0,
        });
      }

      if (result.steps.notificationDelivery.smsResult && input.customerPhone) {
        await saveNotification({
          deliveryId: input.deliveryId,
          customerId: input.customerId,
          channel: 'sms',
          recipient: input.customerPhone,
          message: result.steps.messageGeneration.message,
          status: result.steps.notificationDelivery.smsResult.success ? 'sent' : 'failed',
          messageId: result.steps.notificationDelivery.smsResult.messageId,
          error: result.steps.notificationDelivery.smsResult.error,
          delayMinutes: result.steps.trafficCheck?.delayMinutes || 0,
        });
      }
    }

    // Mark workflow as completed
    currentStep = 'completed';
    result.success = !canceled;

    if (canceled) {
      result.error = `Workflow canceled: ${cancelReason}`;
      console.log(`❌ Workflow canceled for delivery ${input.deliveryId}`);
    } else if (!result.steps.delayEvaluation?.exceedsThreshold) {
      console.log(`✅ Workflow completed: No notification needed (delay within threshold)`);
    } else {
      console.log(`✅ Workflow completed successfully for delivery ${input.deliveryId}`);
    }

    // Save workflow execution to database
    await saveWorkflowExecution({
      workflowId: `delay-notification-${input.deliveryId}-${Date.now()}`,
      runId: `run-${Date.now()}`,
      deliveryId: input.deliveryId,
      status: 'completed',
      steps: result.steps,
    });

  } catch (error) {
    currentStep = 'failed';
    result.success = false;
    result.error = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`❌ Workflow failed: ${result.error}`);

    // Save failed workflow execution to database
    try {
      await saveWorkflowExecution({
        workflowId: `delay-notification-${input.deliveryId}-${Date.now()}`,
        runId: `run-${Date.now()}`,
        deliveryId: input.deliveryId,
        status: 'failed',
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
  input: RecurringCheckWorkflowInput
): Promise<DelayNotificationWorkflowResult> {
  console.log(`🔄 Starting Recurring Traffic Check Workflow for delivery ${input.deliveryId}`);
  console.log(`📊 Configuration: Check every ${input.checkIntervalMinutes} minutes, max ${input.maxChecks === -1 ? 'unlimited' : input.maxChecks} checks`);

  let canceled = false;
  let cancelReason = '';
  let thresholdMinutes = input.thresholdMinutes || 30;
  let checksPerformed = 0;
  let currentStep: WorkflowStatusQuery['currentStep'] = 'traffic_check';

  const result: DelayNotificationWorkflowResult = {
    workflowId: input.deliveryId,
    deliveryId: input.deliveryId,
    processedAt: new Date().toISOString(),
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
    lastUpdateAt: new Date().toISOString(),
    delayDetected: result.steps.delayEvaluation?.exceedsThreshold,
    notificationSent: result.steps.notificationDelivery?.sent,
  }));

  try {
    // Main recurring check loop
    while (true) {
      console.log(`\n🔄 Recurring check ${checksPerformed + 1}${input.maxChecks === -1 ? '' : `/${input.maxChecks}`} for delivery ${input.deliveryId}`);

      // Check stop condition 1: Max checks reached (skip if unlimited)
      if (input.maxChecks !== -1 && checksPerformed >= input.maxChecks) {
        console.log(`✅ Recurring checks completed: ${checksPerformed}/${input.maxChecks} checks performed`);
        result.success = true;
        break;
      }

      // Check stop condition 2: Manual cancellation
      if (canceled) {
        console.log(`❌ Workflow canceled: ${cancelReason}`);
        result.error = `Workflow canceled: ${cancelReason}`;
        break;
      }

      // Get current delivery details
      const deliveryDetailsResult = await getDeliveryDetails({
        deliveryId: input.deliveryId,
      });

      if (!deliveryDetailsResult.success || !deliveryDetailsResult.delivery) {
        console.error(`❌ Failed to fetch delivery details`);
        result.error = 'Failed to fetch delivery details';
        break;
      }

      const deliveryDetails = deliveryDetailsResult.delivery;

      // Check stop condition 3: Delivery status changed to terminal state
      const terminalStatuses = ['delivered', 'cancelled', 'failed'];
      if (terminalStatuses.includes(deliveryDetails.status)) {
        console.log(`✅ Delivery reached terminal status: ${deliveryDetails.status}`);
        result.success = true;
        break;
      }

      // Check stop condition 4: Scheduled delivery time + 2 hours has passed
      const scheduledTime = new Date(deliveryDetails.scheduledDelivery);
      const cutoffTime = new Date(scheduledTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours
      const now = new Date();

      if (now > cutoffTime) {
        console.log(`✅ Cutoff time reached (scheduled delivery + 2 hours)`);
        result.success = true;
        break;
      }

      // Perform traffic check (Step 1)
      currentStep = 'traffic_check';
      console.log('[Recurring] Step 1: Checking traffic conditions...');
      result.steps.trafficCheck = await checkTrafficConditions({
        origin: input.origin,
        destination: input.destination,
        departureTime: input.scheduledTime,
      });

      console.log(`[Recurring] Traffic check complete: ${result.steps.trafficCheck.delayMinutes} minutes delay detected`);

      // Save traffic snapshot
      await saveTrafficSnapshot({
        routeId: input.routeId,
        trafficCondition: result.steps.trafficCheck.trafficCondition,
        delayMinutes: result.steps.trafficCheck.delayMinutes,
        durationSeconds: result.steps.trafficCheck.estimatedDurationMinutes * 60,
      });

      // Evaluate delay (Step 2)
      currentStep = 'delay_evaluation';
      console.log('[Recurring] Step 2: Evaluating delay against threshold...');
      result.steps.delayEvaluation = await evaluateDelay({
        delayMinutes: result.steps.trafficCheck.delayMinutes,
        thresholdMinutes,
        deliveryId: input.deliveryId,
      });

      console.log(`[Recurring] Delay evaluation: ${result.steps.delayEvaluation.exceedsThreshold ? 'EXCEEDS' : 'WITHIN'} threshold`);

      // Only notify if threshold exceeded
      if (result.steps.delayEvaluation.exceedsThreshold) {
        console.log(`⚠️ Delay exceeds threshold (${result.steps.trafficCheck.delayMinutes} > ${thresholdMinutes}), checking if notification needed...`);

        // Check last notification to avoid spam
        const lastNotificationResult = await getLastNotification({ deliveryId: input.deliveryId });
        let shouldNotify = false;

        if (!lastNotificationResult.success || !lastNotificationResult.notification) {
          // No previous notification - this is the first one
          shouldNotify = true;
          console.log(`📢 First notification for this delivery - will notify`);
        } else {
          const lastNotif = lastNotificationResult.notification;
          const currentDelay = result.steps.trafficCheck.delayMinutes;
          const lastDelay = lastNotif.delayMinutes;
          const delayChange = Math.abs(currentDelay - lastDelay);
          const timeSinceLastNotif = Date.now() - new Date(lastNotif.sentAt).getTime();
          const hoursSinceLastNotif = timeSinceLastNotif / (1000 * 60 * 60);

          // Notification deduplication rules - use delivery-specific settings
          // 1. Delay changed significantly (configurable threshold)
          // 2. OR sufficient time has passed since last notification (configurable hours)
          const minDelayChangeThreshold = deliveryDetails.minDelayChangeThreshold || 15; // minutes
          const minHoursBetweenNotifications = deliveryDetails.minHoursBetweenNotifications || 1.0; // hours

          if (delayChange >= minDelayChangeThreshold) {
            shouldNotify = true;
            console.log(`📢 Delay changed significantly (${lastDelay}min → ${currentDelay}min, Δ=${delayChange}min >= ${minDelayChangeThreshold}min) - will notify`);
          } else if (hoursSinceLastNotif >= minHoursBetweenNotifications) {
            shouldNotify = true;
            console.log(`📢 Sufficient time passed (${hoursSinceLastNotif.toFixed(1)}h >= ${minHoursBetweenNotifications}h since last notification) - will notify`);
          } else {
            shouldNotify = false;
            console.log(`🔕 Skipping notification - delay change (Δ=${delayChange}min < ${minDelayChangeThreshold}min) and only ${hoursSinceLastNotif.toFixed(1)}h (< ${minHoursBetweenNotifications}h) since last notification`);
          }
        }

        if (!shouldNotify) {
          console.log(`⏭️ Skipping notification for this check`);
          // Still increment check counter even though we didn't notify
          const incrementResult = await incrementChecksPerformed({
            deliveryId: input.deliveryId,
          });
          if (incrementResult.success) {
            checksPerformed = incrementResult.checksPerformed;
            console.log(`✅ Checks performed: ${checksPerformed}${input.maxChecks === -1 ? '' : `/${input.maxChecks}`}`);
          }
          // Continue to next check without notifying
          continue;
        }

        console.log(`📨 Proceeding with notification...`);

        // Update delivery status to "delayed"
        await updateDeliveryStatusInDb({
          deliveryId: input.deliveryId,
          status: 'delayed',
        });

        // Generate AI message (Step 3)
        currentStep = 'message_generation';
        console.log('[Recurring] Step 3: Generating AI notification message...');
        const estimatedArrival = new Date(new Date(input.scheduledTime).getTime() +
          (result.steps.trafficCheck.delayMinutes * 60000)).toISOString();

        result.steps.messageGeneration = await generateAIMessage({
          deliveryId: input.deliveryId,
          customerId: input.customerId,
          origin: input.origin.address,
          destination: input.destination.address,
          delayMinutes: result.steps.trafficCheck.delayMinutes,
          trafficCondition: result.steps.trafficCheck.trafficCondition,
          estimatedArrival,
          originalArrival: input.scheduledTime,
        });

        console.log('[Recurring] AI message generated successfully');

        // Send notification (Step 4)
        currentStep = 'notification_delivery';
        console.log('[Recurring] Step 4: Sending notification to customer...');
        result.steps.notificationDelivery = await sendNotification({
          recipientEmail: input.customerEmail,
          recipientPhone: input.customerPhone,
          message: result.steps.messageGeneration.message,
          subject: result.steps.messageGeneration.subject,
          deliveryId: input.deliveryId,
          priority: result.steps.delayEvaluation.severity === 'severe' ? 'high' : 'normal',
        });

        console.log(`[Recurring] Notification sent via ${result.steps.notificationDelivery.channel}`);

        // Save notifications to database
        if (result.steps.notificationDelivery.emailResult && input.customerEmail) {
          await saveNotification({
            deliveryId: input.deliveryId,
            customerId: input.customerId,
            channel: 'email',
            recipient: input.customerEmail,
            message: result.steps.messageGeneration.message,
            status: result.steps.notificationDelivery.emailResult.success ? 'sent' : 'failed',
            messageId: result.steps.notificationDelivery.emailResult.messageId,
            error: result.steps.notificationDelivery.emailResult.error,
            delayMinutes: result.steps.trafficCheck.delayMinutes,
          });
        }

        if (result.steps.notificationDelivery.smsResult && input.customerPhone) {
          await saveNotification({
            deliveryId: input.deliveryId,
            customerId: input.customerId,
            channel: 'sms',
            recipient: input.customerPhone,
            message: result.steps.messageGeneration.message,
            status: result.steps.notificationDelivery.smsResult.success ? 'sent' : 'failed',
            messageId: result.steps.notificationDelivery.smsResult.messageId,
            error: result.steps.notificationDelivery.smsResult.error,
            delayMinutes: result.steps.trafficCheck.delayMinutes,
          });
        }
      } else {
        console.log(`✅ No notification needed - delay within threshold (${result.steps.trafficCheck.delayMinutes} ≤ ${thresholdMinutes})`);
      }

      // Increment checks_performed counter
      const incrementResult = await incrementChecksPerformed({
        deliveryId: input.deliveryId,
      });

      if (incrementResult.success) {
        checksPerformed = incrementResult.checksPerformed;
        console.log(`✅ Checks performed: ${checksPerformed}${input.maxChecks === -1 ? '' : `/${input.maxChecks}`}`);
      }

      // Check if this was the last check (skip if unlimited)
      if (input.maxChecks !== -1 && checksPerformed >= input.maxChecks) {
        console.log(`✅ Max checks reached: ${checksPerformed}/${input.maxChecks}`);
        result.success = true;
        break;
      }

      // Sleep for the configured interval
      const sleepDurationMs = input.checkIntervalMinutes * 60 * 1000;
      console.log(`⏸️  Sleeping for ${input.checkIntervalMinutes} minutes...`);
      await sleep(sleepDurationMs);
    }

    // Mark workflow as completed
    currentStep = 'completed';

    // Save workflow execution
    await saveWorkflowExecution({
      workflowId: `recurring-check-${input.deliveryId}`,
      runId: `run-${Date.now()}`,
      deliveryId: input.deliveryId,
      status: 'completed',
      steps: { checksPerformed, ...result.steps },
    });

  } catch (error) {
    currentStep = 'failed';
    result.success = false;
    result.error = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`❌ Recurring workflow failed: ${result.error}`);

    // Save failed workflow execution
    try {
      await saveWorkflowExecution({
        workflowId: `recurring-check-${input.deliveryId}`,
        runId: `run-${Date.now()}`,
        deliveryId: input.deliveryId,
        status: 'failed',
        steps: { checksPerformed, ...result.steps },
        error: result.error,
      });
    } catch (saveError) {
      console.error(`❌ Failed to save workflow execution: ${saveError}`);
    }

    throw error;
  }

  return result;
}