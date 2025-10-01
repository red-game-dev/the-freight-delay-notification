/**
 * Temporal Workflow Definition for Freight Delay Notification
 * Implements the 4-step process as specified in the PDF
 */

import { proxyActivities, defineSignal, defineQuery, setHandler } from '@temporalio/workflow';
import type * as activities from './activities';
import type {
  DelayNotificationWorkflowInput,
  DelayNotificationWorkflowResult,
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