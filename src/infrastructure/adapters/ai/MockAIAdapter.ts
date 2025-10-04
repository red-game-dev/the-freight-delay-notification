/**
 * Mock AI Adapter
 * Always-available fallback for testing without real AI service
 */

import { logger } from "@/core/base/utils/Logger";
import { type Result, success } from "../../../core/base/utils/Result";
import type {
  AIAdapter,
  GeneratedMessage,
  MessageGenerationInput,
} from "./AIAdapter.interface";

export class MockAIAdapter implements AIAdapter {
  public readonly providerName = "Mock AI";
  public readonly priority = 999; // Lowest priority - only used as last resort

  isAvailable(): boolean {
    return true; // Always available for testing
  }

  async generateMessage(
    input: MessageGenerationInput,
  ): Promise<Result<GeneratedMessage>> {
    logger.info(
      `🤖 [Mock AI] Generating mock message for delivery ${input.deliveryId}`,
    );
    logger.info(`   Delay: ${input.delayMinutes} minutes`);
    logger.info(`   Traffic: ${input.trafficCondition}`);

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    const message = this.createMockMessage(input);
    const subject = this.generateSubject(input);

    logger.info(`✅ [Mock AI] Mock message generated successfully`);
    logger.info(`   Subject: ${subject}`);

    return success({
      message,
      subject,
      model: "mock-template",
      tokens: message.length, // Mock token count
      generatedAt: new Date(),
    });
  }

  private createMockMessage(input: MessageGenerationInput): string {
    const deliveryRef = input.trackingNumber || input.deliveryId;
    const newETA = new Date(input.estimatedArrival).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // SMS-friendly short message (under 160 characters) with route
    // Note: Using plain string template instead of structured object (e.g., JSON) since the message
    // is sent directly to customers without further manipulation. For scenarios requiring post-processing
    // like translation, A/B testing, or dynamic formatting, a structured approach would be better.
    return `${input.origin}→${input.destination} - ${deliveryRef}: ${input.delayMinutes}min delay, ${input.trafficCondition} traffic. ETA ${newETA}`;
  }

  private generateSubject(input: MessageGenerationInput): string {
    const deliveryRef = input.trackingNumber || input.deliveryId;
    // Shorter subject lines
    if (input.delayMinutes > 60) {
      return `Traffic Delay: ${input.delayMinutes}min - ${deliveryRef}`;
    } else if (input.delayMinutes > 30) {
      return `Delay: ${input.delayMinutes}min - ${deliveryRef}`;
    } else {
      return `Minor delay - ${deliveryRef}`;
    }
  }
}
