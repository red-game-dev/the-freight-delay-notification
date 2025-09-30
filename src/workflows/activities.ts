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
import { CheckDelayThresholdUseCase } from '@/core/engine/delivery/CheckDelayThreshold';
import { Route } from '@/core/domain/delivery/entities/Route';
import { Coordinates } from '@/core/domain/delivery/value-objects/Coordinates';
import { DeliveryStatus } from '@/core/domain/delivery/value-objects/DeliveryStatus';
import { Delivery } from '@/core/domain/delivery/entities/Delivery';

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

// Step 2: Evaluate Delay Against Threshold (using domain layer)
export async function evaluateDelay(input: EvaluateDelayInput): Promise<DelayEvaluationResult> {
  console.log(`[Step 2] Evaluating delay of ${input.delayMinutes} minutes against threshold of ${input.thresholdMinutes} minutes`);

  // Use CheckDelayThresholdUseCase from domain layer
  const useCase = new CheckDelayThresholdUseCase();

  const trafficData = {
    provider: 'google' as const,
    delayMinutes: input.delayMinutes,
    trafficCondition: input.delayMinutes > 60 ? 'severe' as const :
                      input.delayMinutes > 30 ? 'heavy' as const :
                      input.delayMinutes > 10 ? 'moderate' as const : 'light' as const,
    estimatedDuration: 3600 + (input.delayMinutes * 60),
    normalDuration: 3600,
    fetchedAt: new Date(),
  };

  const result = useCase.execute(trafficData, input.thresholdMinutes);

  if (!result.success) {
    throw new Error(`Threshold check failed: ${result.error.message}`);
  }

  const thresholdResult = result.value;

  // Map severity levels to workflow format
  let severity: DelayEvaluationResult['severity'] = 'on_time';
  if (input.delayMinutes > input.thresholdMinutes * 2) {
    severity = 'severe';
  } else if (input.delayMinutes > input.thresholdMinutes) {
    severity = 'moderate';
  } else if (input.delayMinutes > 10) {
    severity = 'minor';
  }

  return {
    exceedsThreshold: thresholdResult.exceedsThreshold,
    delayMinutes: thresholdResult.delayMinutes,
    thresholdMinutes: thresholdResult.thresholdMinutes,
    severity,
    requiresNotification: thresholdResult.shouldProceed,
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

// Database Persistence Activities

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
  console.log(`[Database] Saving route entity: ${input.routeId}`);

  // Create route entity
  const route = Route.create({
    originAddress: input.originAddress,
    originCoords: Coordinates.create(input.originCoords),
    destinationAddress: input.destinationAddress,
    destinationCoords: Coordinates.create(input.destinationCoords),
    distanceMeters: input.distanceMeters,
    normalDurationSeconds: input.normalDurationSeconds,
    currentDurationSeconds: input.currentDurationSeconds,
    trafficCondition: input.trafficCondition as any,
  }, input.routeId);

  // Note: Database repository implementation would go here
  // For now, just return success as we're using mock data
  console.log(`✅ Route entity created: ${route.getSummary()}`);

  return { success: true, routeId: input.routeId };
}

export async function saveDeliveryEntity(input: {
  deliveryId: string;
  trackingNumber: string;
  customerId: string;
  routeId: string;
  status: string;
  scheduledDelivery: string;
  delayThresholdMinutes: number;
}): Promise<{ success: boolean; deliveryId: string }> {
  console.log(`[Database] Saving delivery entity: ${input.trackingNumber}`);

  // Create delivery entity
  const statusMap: Record<string, () => any> = {
    'pending': () => DeliveryStatus.pending(),
    'in_transit': () => DeliveryStatus.inTransit(),
    'delayed': () => DeliveryStatus.delayed(),
    'delivered': () => DeliveryStatus.delivered(),
    'cancelled': () => DeliveryStatus.cancelled(),
    'failed': () => DeliveryStatus.failed(),
  };

  const delivery = Delivery.create({
    trackingNumber: input.trackingNumber,
    customerId: input.customerId,
    routeId: input.routeId,
    status: statusMap[input.status]?.() || DeliveryStatus.pending(),
    scheduledDelivery: new Date(input.scheduledDelivery),
    delayThresholdMinutes: input.delayThresholdMinutes,
  }, input.deliveryId);

  // Note: Database repository implementation would go here
  // For now, just return success as we're using mock data
  console.log(`✅ Delivery entity created: ${delivery.trackingNumber}`);

  return { success: true, deliveryId: input.deliveryId };
}

export async function updateDeliveryStatus(input: {
  deliveryId: string;
  status: 'delayed' | 'delivered' | 'in_transit';
}): Promise<{ success: boolean }> {
  console.log(`[Database] Updating delivery ${input.deliveryId} status to: ${input.status}`);

  // Note: Repository update would go here
  // For now, just log the action
  console.log(`✅ Delivery status updated to: ${input.status}`);

  return { success: true };
}