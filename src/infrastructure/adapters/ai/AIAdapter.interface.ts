/**
 * AI Adapter Interface
 * Defines the contract for all AI message generation providers
 */

import type { Result } from "../../../core/base/utils/Result";

export interface MessageGenerationInput {
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

export interface GeneratedMessage {
  message: string;
  subject: string;
  model: string;
  tokens?: number;
  generatedAt: Date;
}

export interface AIAdapter {
  /**
   * Provider name for logging and tracking
   */
  readonly providerName: string;

  /**
   * Priority order for fallback (lower number = higher priority)
   */
  readonly priority: number;

  /**
   * Check if this adapter is properly configured and ready to use
   */
  isAvailable(): boolean;

  /**
   * Generate delay notification message
   */
  generateMessage(
    input: MessageGenerationInput,
  ): Promise<Result<GeneratedMessage>>;
}
