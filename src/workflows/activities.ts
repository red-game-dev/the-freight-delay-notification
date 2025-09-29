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
import { TrafficService } from '../infrastructure/adapters/traffic/TrafficService';

// Step 1: Check Traffic Conditions
export async function checkTrafficConditions(input: CheckTrafficInput): Promise<TrafficCheckResult> {
  console.log(`[Step 1] Checking traffic from ${input.origin.address} to ${input.destination.address}`);

  // Use TrafficService which handles all adapters and fallback
  const trafficService = new TrafficService();

  const result = await trafficService.getTrafficData({
    origin: input.origin.address,
    destination: input.destination.address,
    originCoords: input.origin.coordinates,
    destinationCoords: input.destination.coordinates,
    departureTime: input.departureTime ? new Date(input.departureTime) : undefined,
  });

  if (result.success) {
    const data = result.value;
    return {
      provider: data.provider,
      delayMinutes: data.delayMinutes,
      trafficCondition: data.trafficCondition,
      estimatedDurationMinutes: Math.round(data.estimatedDuration / 60),
      normalDurationMinutes: Math.round(data.normalDuration / 60),
      distance: data.distance || { value: 0, unit: 'km' },
      timestamp: data.fetchedAt.toISOString(),
    };
  }

  // This shouldn't happen with MockTrafficAdapter as last resort
  throw new Error(`Traffic data fetch failed: ${result.error.message}`);
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