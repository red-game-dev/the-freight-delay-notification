/**
 * Temporal Workflow Types for Freight Delay Notification System
 * Following Temporal TypeScript SDK best practices
 */

// ===== Workflow Input Types =====
// Using single object parameter as per Temporal best practices

export interface DelayNotificationWorkflowInput {
  deliveryId: string;
  trackingNumber?: string;
  routeId: string;
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  origin: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  destination: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  scheduledTime: string; // ISO 8601 string
  thresholdMinutes?: number; // Default 30 minutes as per PDF
}

export interface RecurringCheckWorkflowInput extends DelayNotificationWorkflowInput {
  checkIntervalMinutes: number; // How often to check (15, 30, 60, 120, 180)
  maxChecks: number; // Maximum number of checks (1-100)
}

// ===== Activity Input/Output Types =====

// Step 1: Traffic Check Activity Types
export interface CheckTrafficInput {
  origin: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  destination: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  departureTime?: string; // ISO 8601 string
}

export interface TrafficCheckResult {
  provider: 'google' | 'mapbox'; // Track which API was used
  delayMinutes: number;
  trafficCondition: 'light' | 'moderate' | 'heavy' | 'severe';
  estimatedDurationMinutes: number;
  normalDurationMinutes: number;
  distance: {
    value: number;
    unit: string;
  };
  timestamp: string; // When the check was performed
  rawData?: any; // Original API response for debugging
}

// Step 2: Threshold Check Activity Types
export interface EvaluateDelayInput {
  delayMinutes: number;
  thresholdMinutes: number;
  deliveryId: string;
}

export interface DelayEvaluationResult {
  exceedsThreshold: boolean;
  delayMinutes: number;
  thresholdMinutes: number;
  severity: 'on_time' | 'minor' | 'moderate' | 'severe';
  requiresNotification: boolean;
}

// Step 3: AI Message Generation Activity Types
export interface GenerateMessageInput {
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

export interface MessageGenerationResult {
  message: string;
  subject?: string;
  model: string; // GPT-4o-mini or fallback
  tokens?: number;
  generatedAt: string;
  fallbackUsed: boolean;
}

// Step 4: Notification Delivery Activity Types
export interface SendNotificationInput {
  recipientEmail?: string;
  recipientPhone?: string;
  message: string;
  subject?: string;
  deliveryId: string;
  priority: 'low' | 'normal' | 'high';
}

export interface NotificationResult {
  sent: boolean;
  channel: 'email' | 'sms' | 'both' | 'none';
  emailResult?: {
    success: boolean;
    messageId?: string;
    error?: string;
    provider: 'sendgrid' | 'fallback';
  };
  smsResult?: {
    success: boolean;
    messageId?: string;
    error?: string;
    provider: 'twilio' | 'fallback';
  };
  timestamp: string;
}

// ===== Workflow Output Type =====
export interface DelayNotificationWorkflowResult {
  workflowId: string;
  deliveryId: string;
  processedAt: string;
  steps: {
    trafficCheck?: TrafficCheckResult;
    delayEvaluation?: DelayEvaluationResult;
    messageGeneration?: MessageGenerationResult;
    notificationDelivery?: NotificationResult;
  };
  success: boolean;
  error?: string;
}

// ===== Signal Types (for workflow control) =====
export interface CancelNotificationSignal {
  reason: string;
  canceledBy?: string;
}

export interface UpdateThresholdSignal {
  newThresholdMinutes: number;
}

// ===== Query Types (for workflow state inspection) =====
export interface WorkflowStatusQuery {
  currentStep: 'traffic_check' | 'delay_evaluation' | 'message_generation' | 'notification_delivery' | 'completed' | 'failed';
  startedAt: string;
  lastUpdateAt: string;
  delayDetected?: boolean;
  notificationSent?: boolean;
}

// ===== Error Types =====
export class TrafficCheckError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'TrafficCheckError';
  }
}

export class MessageGenerationError extends Error {
  constructor(
    message: string,
    public readonly model: string,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'MessageGenerationError';
  }
}

export class NotificationDeliveryError extends Error {
  constructor(
    message: string,
    public readonly channel: string,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'NotificationDeliveryError';
  }
}

// ===== Retry Policy Configuration =====
export const RETRY_POLICIES = {
  trafficCheck: {
    initialInterval: '5s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
    maximumInterval: '30s',
    nonRetryableErrorTypes: ['RateLimitError', 'InvalidCredentialsError'],
  },
  aiGeneration: {
    initialInterval: '2s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
    maximumInterval: '20s',
    nonRetryableErrorTypes: ['InvalidAPIKeyError', 'ContentPolicyViolation'],
  },
  notification: {
    initialInterval: '3s',
    backoffCoefficient: 2,
    maximumAttempts: 5,
    maximumInterval: '60s',
    nonRetryableErrorTypes: ['InvalidRecipientError', 'BlacklistedRecipientError'],
  },
};

// ===== Activity Timeout Configuration =====
export const ACTIVITY_TIMEOUTS = {
  trafficCheck: {
    startToCloseTimeout: '30s',
    heartbeatTimeout: '10s',
  },
  aiGeneration: {
    startToCloseTimeout: '60s',
    heartbeatTimeout: '20s',
  },
  notification: {
    startToCloseTimeout: '45s',
    heartbeatTimeout: '15s',
  },
};