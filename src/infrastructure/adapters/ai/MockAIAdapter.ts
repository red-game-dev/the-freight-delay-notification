/**
 * Mock AI Adapter
 * Always-available fallback for testing without real AI service
 */

import { logger } from '@/core/base/utils/Logger';
import { Result, success } from '../../../core/base/utils/Result';
import { AIAdapter, MessageGenerationInput, GeneratedMessage } from './AIAdapter.interface';

export class MockAIAdapter implements AIAdapter {
  public readonly providerName = 'Mock AI';
  public readonly priority = 999; // Lowest priority - only used as last resort

  isAvailable(): boolean {
    return true; // Always available for testing
  }

  async generateMessage(input: MessageGenerationInput): Promise<Result<GeneratedMessage>> {
    logger.info(`🤖 [Mock AI] Generating mock message for delivery ${input.deliveryId}`);
    logger.info(`   Delay: ${input.delayMinutes} minutes`);
    logger.info(`   Traffic: ${input.trafficCondition}`);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 150));

    const message = this.createMockMessage(input);
    const subject = this.generateSubject(input);

    logger.info(`✅ [Mock AI] Mock message generated successfully`);
    logger.info(`   Subject: ${subject}`);

    return success({
      message,
      subject,
      model: 'mock-template',
      tokens: message.length, // Mock token count
      generatedAt: new Date(),
    });
  }

  private createMockMessage(input: MessageGenerationInput): string {
    return `Dear Valued Customer,

We want to inform you that your delivery (ID: ${input.deliveryId}) is experiencing a delay of approximately ${input.delayMinutes} minutes due to ${input.trafficCondition} traffic conditions.

Route: ${input.origin} → ${input.destination}

Original arrival time: ${new Date(input.originalArrival).toLocaleTimeString()}
New estimated arrival: ${new Date(input.estimatedArrival).toLocaleTimeString()}

We sincerely apologize for any inconvenience this delay may cause. Our driver is working to deliver your package as quickly and safely as possible.

Thank you for your patience and understanding.

Best regards,
Freight Delivery Team`;
  }

  private generateSubject(input: MessageGenerationInput): string {
    if (input.delayMinutes > 60) {
      return `Important: Significant Delay - Delivery ${input.deliveryId}`;
    } else if (input.delayMinutes > 30) {
      return `Delivery Update: ${input.delayMinutes}-minute delay - ID ${input.deliveryId}`;
    } else {
      return `Minor Delay Notice - Delivery ${input.deliveryId}`;
    }
  }
}