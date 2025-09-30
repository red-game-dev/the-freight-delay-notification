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
import { NotificationService } from '@/infrastructure/adapters/notifications/NotificationService';
import { AIService } from '@/infrastructure/adapters/ai/AIService';

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

  const aiService = new AIService();

  const result = await aiService.generateMessage({
    deliveryId: input.deliveryId,
    customerId: input.customerId,
    origin: input.origin,
    destination: input.destination,
    delayMinutes: input.delayMinutes,
    trafficCondition: input.trafficCondition,
    estimatedArrival: input.estimatedArrival,
    originalArrival: input.originalArrival,
  });

  if (result.success) {
    return {
      message: result.value.message,
      subject: result.value.subject || `Delivery Update: ${input.delayMinutes}-minute delay`,
      model: result.value.model,
      tokens: result.value.tokens,
      generatedAt: result.value.generatedAt.toISOString(),
      fallbackUsed: result.value.model === 'mock-template' || result.value.model === 'fallback-template',
    };
  }

  // This shouldn't happen with MockAIAdapter as last resort
  throw new Error(`AI message generation failed: ${result.error.message}`);
}

// Step 4: Send Notification
export async function sendNotification(input: SendNotificationInput): Promise<NotificationResult> {
  console.log(`[Step 4] Sending notification for delivery ${input.deliveryId}`);

  const notificationService = new NotificationService();

  const result: NotificationResult = {
    sent: false,
    channel: 'none',
    timestamp: new Date().toISOString(),
  };

  // Prepare notification input
  const notificationInput = {
    deliveryId: input.deliveryId,
    message: input.message,
    subject: input.subject || 'Delivery Update',
    to: '', // Will be set per channel
  };

  let emailSent = false;
  let smsSent = false;

  // Try to send email
  if (input.recipientEmail) {
    const emailResult = await notificationService.send(
      { ...notificationInput, to: input.recipientEmail },
      'email'
    );

    if (emailResult.success) {
      emailSent = true;
      // Map provider to expected workflow type
      const provider = emailResult.value.channel === 'email' ? 'sendgrid' as const : 'fallback' as const;
      result.emailResult = {
        success: true,
        messageId: emailResult.value.messageId,
        provider,
      };
    } else {
      result.emailResult = {
        success: false,
        error: emailResult.error.message,
        provider: 'fallback',
      };
    }
  }

  // Try to send SMS
  if (input.recipientPhone) {
    const smsResult = await notificationService.send(
      { ...notificationInput, to: input.recipientPhone },
      'sms'
    );

    if (smsResult.success) {
      smsSent = true;
      // Map provider to expected workflow type
      const provider = smsResult.value.channel === 'sms' ? 'twilio' as const : 'fallback' as const;
      result.smsResult = {
        success: true,
        messageId: smsResult.value.messageId,
        provider,
      };
    } else {
      result.smsResult = {
        success: false,
        error: smsResult.error.message,
        provider: 'fallback',
      };
    }
  }

  // Determine channel and overall success
  if (emailSent && smsSent) {
    result.channel = 'both';
    result.sent = true;
  } else if (emailSent) {
    result.channel = 'email';
    result.sent = true;
  } else if (smsSent) {
    result.channel = 'sms';
    result.sent = true;
  } else {
    result.channel = 'none';
    result.sent = false;
    console.log('⚠️ No notifications sent - all channels failed');
  }

  return result;
}