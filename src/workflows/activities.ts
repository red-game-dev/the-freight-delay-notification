/**
 * Temporal Activities for Freight Delay Notification Workflow
 * These are the actual implementations of the 4-step process from the PDF
 */

import type {
  CheckTrafficInput,
  TrafficCheckResult,
  EvaluateDelayInput,
  DelayEvaluationResult,
  GenerateMessageInput,
  MessageGenerationResult,
  SendNotificationInput,
  NotificationResult,
} from './types';

// Step 1: Check Traffic Conditions
export async function checkTrafficConditions(input: CheckTrafficInput): Promise<TrafficCheckResult> {
  console.log(`[Step 1] Checking traffic from ${input.origin.address} to ${input.destination.address}`);

  // TODO: Implement actual traffic check using Google Maps or Mapbox
  // For now, return mock data
  return {
    provider: 'google',
    delayMinutes: 45, // Mock delay for testing
    trafficCondition: 'heavy',
    estimatedDurationMinutes: 75,
    normalDurationMinutes: 30,
    distance: {
      value: 25.5,
      unit: 'km',
    },
    timestamp: new Date().toISOString(),
  };
}

// Step 2: Evaluate Delay Against Threshold
export async function evaluateDelay(input: EvaluateDelayInput): Promise<DelayEvaluationResult> {
  console.log(`[Step 2] Evaluating delay of ${input.delayMinutes} minutes against threshold of ${input.thresholdMinutes} minutes`);

  const exceedsThreshold = input.delayMinutes > input.thresholdMinutes;

  let severity: DelayEvaluationResult['severity'] = 'on_time';
  if (input.delayMinutes > input.thresholdMinutes * 2) {
    severity = 'severe';
  } else if (input.delayMinutes > input.thresholdMinutes) {
    severity = 'moderate';
  } else if (input.delayMinutes > 10) {
    severity = 'minor';
  }

  return {
    exceedsThreshold,
    delayMinutes: input.delayMinutes,
    thresholdMinutes: input.thresholdMinutes,
    severity,
    requiresNotification: exceedsThreshold,
  };
}

// Step 3: Generate AI Message
export async function generateAIMessage(input: GenerateMessageInput): Promise<MessageGenerationResult> {
  console.log(`[Step 3] Generating AI message for delivery ${input.deliveryId}`);

  // TODO: Implement actual OpenAI GPT-4o-mini integration
  // For now, return a mock message
  const message = `Dear Customer,

Your delivery from ${input.origin} to ${input.destination} is experiencing a delay of approximately ${input.delayMinutes} minutes due to ${input.trafficCondition} traffic conditions.

The new estimated arrival time is ${input.estimatedArrival}.

We apologize for any inconvenience and appreciate your patience.

Delivery ID: ${input.deliveryId}`;

  return {
    message,
    subject: `Delivery Update: ${input.delayMinutes}-minute delay expected`,
    model: 'gpt-4o-mini',
    generatedAt: new Date().toISOString(),
    fallbackUsed: false,
  };
}

// Step 4: Send Notification
export async function sendNotification(input: SendNotificationInput): Promise<NotificationResult> {
  console.log(`[Step 4] Sending notification for delivery ${input.deliveryId}`);

  // TODO: Implement actual SendGrid/Twilio integration
  // For now, return mock success
  const result: NotificationResult = {
    sent: true,
    channel: 'none',
    timestamp: new Date().toISOString(),
  };

  if (input.recipientEmail) {
    console.log(`   - Sending email to: ${input.recipientEmail}`);
    result.channel = 'email';
    result.emailResult = {
      success: true,
      messageId: `email-${Date.now()}`,
      provider: 'sendgrid',
    };
  }

  if (input.recipientPhone) {
    console.log(`   - Sending SMS to: ${input.recipientPhone}`);
    result.channel = result.channel === 'email' ? 'both' : 'sms';
    result.smsResult = {
      success: true,
      messageId: `sms-${Date.now()}`,
      provider: 'twilio',
    };
  }

  return result;
}