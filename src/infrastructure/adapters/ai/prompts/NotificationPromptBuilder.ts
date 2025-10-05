/**
 * Notification Prompt Builder
 * Utility functions for building AI prompts for different notification types (email, SMS, etc.)
 */

export interface NotificationContext {
  deliveryId: string;
  trackingNumber?: string;
  customerId: string;
  origin: string;
  destination: string;
  delayMinutes: number;
  trafficCondition: string;
  estimatedArrival: string;
  originalArrival: string;
}

/**
 * Build prompt for SMS notifications (ultra-short, max 80 chars)
 * Twilio overhead: ~20 chars, so safe limit is 80 chars total
 */
export function buildSMSPrompt(context: NotificationContext): {
  prompt: string;
  systemPrompt: string;
} {
  const deliveryRef =
    context.trackingNumber || context.deliveryId.substring(0, 8);
  const newETA = new Date(context.estimatedArrival).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Shorten location names for SMS
  const shortOrigin = context.origin.split(",")[0]; // Just city name
  const shortDest = context.destination.split(",")[0]; // Just city name

  return {
    systemPrompt:
      "You are a freight delivery SMS system. Generate ULTRA-SHORT traffic delay messages under 80 characters. Use abbreviations. NO greetings, NO sign-offs. Direct only.",
    prompt: `Generate ultra-concise traffic delay SMS (MAX 80 chars):

Route: ${shortOrigin} → ${shortDest}
Tracking: ${deliveryRef}
Delay: ${context.delayMinutes}min
ETA: ${newETA}

Requirements:
- MAX 80 characters total (strict limit for Twilio)
- Use abbreviations (min=m, ETA, etc)
- Include tracking, delay time, new ETA
- NO formalities, NO extra words

Example (67 chars): "${deliveryRef}: ${context.delayMinutes}m delay. Heavy traffic. ETA ${newETA}"

Generate similar ultra-short message.`,
  };
}

/**
 * Build prompt for Email notifications (longer, more detailed)
 */
export function buildEmailPrompt(context: NotificationContext): {
  prompt: string;
  systemPrompt: string;
} {
  const deliveryRef = context.trackingNumber || context.deliveryId;
  const newETA = new Date(context.estimatedArrival).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const originalETA = new Date(context.originalArrival).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    systemPrompt:
      "You are a professional freight delivery notification system. Generate friendly, informative delay notifications for email. Be courteous, clear, and provide helpful details. Use a warm but professional tone.",
    prompt: `Generate a professional email notification about a traffic delay:

Route: ${context.origin} → ${context.destination}
Tracking Number: ${deliveryRef}
Delay: ${context.delayMinutes} minutes
Traffic Condition: ${context.trafficCondition}
Original ETA: ${originalETA}
Revised ETA: ${newETA}

Create an email body (2-3 paragraphs, max 300 words) that:
1. Opens with a friendly greeting
2. Explains the delay situation clearly
3. Provides the new estimated arrival time
4. Mentions the traffic condition causing the delay
5. Apologizes for the inconvenience
6. Offers contact information if they have questions
7. Closes professionally

Keep the tone warm and customer-friendly while being informative.`,
  };
}

/**
 * Build subject line for email notifications
 */
export function buildEmailSubject(context: NotificationContext): string {
  const deliveryRef =
    context.trackingNumber || context.deliveryId.substring(0, 8);

  if (context.delayMinutes > 60) {
    return `Traffic Delay: ${context.delayMinutes}min - ${deliveryRef}`;
  } else if (context.delayMinutes > 30) {
    return `Delivery Update: ${context.delayMinutes}min delay - ${deliveryRef}`;
  } else {
    return `Minor delay - ${deliveryRef}`;
  }
}

/**
 * Build fallback template for SMS (when AI is disabled or fails)
 * MAX 80 chars to account for Twilio overhead (~20 chars)
 */
export function buildSMSFallback(context: NotificationContext): string {
  const deliveryRef =
    context.trackingNumber || context.deliveryId.substring(0, 8);
  const newETA = new Date(context.estimatedArrival).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Ultra-short format: max 80 chars
  // Example: "ABC12345: 45m delay. Heavy traffic. ETA 3:30 PM" (50 chars)
  const trafficShort = context.trafficCondition.includes("heavy")
    ? "Heavy"
    : context.trafficCondition.includes("moderate")
      ? "Mod"
      : "Light";

  return `${deliveryRef}: ${context.delayMinutes}m delay. ${trafficShort} traffic. ETA ${newETA}`;
}

/**
 * Build fallback template for Email (when AI is disabled or fails)
 */
export function buildEmailFallback(context: NotificationContext): string {
  const deliveryRef = context.trackingNumber || context.deliveryId;
  const newETA = new Date(context.estimatedArrival).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `Dear Customer,

We wanted to inform you that your delivery (Tracking: ${deliveryRef}) from ${context.origin} to ${context.destination} is experiencing a ${context.delayMinutes}-minute delay due to ${context.trafficCondition} traffic conditions.

Your new estimated arrival time is ${newETA}.

We apologize for any inconvenience this may cause. If you have any questions or concerns, please don't hesitate to contact our support team.

Thank you for your patience and understanding.

Best regards,
Freight Delivery Team`;
}
