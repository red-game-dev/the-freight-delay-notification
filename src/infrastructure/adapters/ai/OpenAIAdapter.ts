/**
 * OpenAI Adapter for AI Message Generation
 * PDF Step 3: Generate notification message using GPT-4o-mini
 */

import OpenAI from 'openai';
import { env } from '../../config/EnvValidator';
import { Result, success } from '../../../core/base/utils/Result';
import { AIAdapter, MessageGenerationInput, GeneratedMessage } from './AIAdapter.interface';
import { logger, getErrorMessage } from '@/core/base/utils/Logger';

export class OpenAIAdapter implements AIAdapter {
  public readonly providerName = 'OpenAI';
  public readonly priority = 1; // Primary AI provider

  private client: OpenAI | null = null;
  private readonly model = 'gpt-4o-mini'; // As specified in PDF

  constructor() {
    if (env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
    }
  }

  isAvailable(): boolean {
    return !!this.client;
  }

  async generateMessage(input: MessageGenerationInput): Promise<Result<GeneratedMessage>> {
    if (!this.isAvailable()) {
      logger.info('⚠️ OpenAI API key not configured, using fallback message');
      return this.generateFallbackMessage(input);
    }

    try {
      logger.info(`🤖 [Step 3] Generating AI message with ${this.model}...`);

      const prompt = this.createPrompt(input);

      const completion = await this.client!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful customer service assistant for a freight delivery company. Generate concise, professional, and empathetic delay notifications for customers. Include all relevant details and maintain a positive tone.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const message = completion.choices[0].message.content || this.createFallbackMessageText(input);
      const subject = this.generateSubject(input);

      logger.info(`✅ [Step 3] AI message generated successfully`);
      logger.info(`   Model: ${this.model}`);
      logger.info(`   Tokens: ${completion.usage?.total_tokens || 'unknown'}`);

      return success({
        message,
        subject,
        model: this.model,
        tokens: completion.usage?.total_tokens,
        generatedAt: new Date(),
      });
    } catch (error: unknown) {
      logger.error('❌ OpenAI API error:', getErrorMessage(error));

      // Fallback to template message
      return this.generateFallbackMessage(input);
    }
  }

  private createPrompt(input: MessageGenerationInput): string {
    const deliveryRef = input.trackingNumber || input.deliveryId;
    return `Generate a professional and empathetic delivery delay notification email for the following situation:

Tracking Number: ${deliveryRef}
Route: ${input.origin} to ${input.destination}
Delay: ${input.delayMinutes} minutes
Traffic Condition: ${input.trafficCondition}
Original Arrival Time: ${new Date(input.originalArrival).toLocaleString()}
New Estimated Arrival: ${new Date(input.estimatedArrival).toLocaleString()}

Please create a brief, clear message that:
1. Apologizes for the delay
2. Explains the traffic situation in a customer-friendly way
3. Provides the new estimated arrival time
4. Thanks the customer for their patience

IMPORTANT: Vary the wording, tone, and structure based on the specific situation. Don't use generic templates. Make it feel personalized to THIS specific delay scenario.

Keep it under 150 words and maintain a professional yet friendly tone.`;
  }

  private generateFallbackMessage(input: MessageGenerationInput): Result<GeneratedMessage> {
    logger.info('📝 Using fallback message template');

    const message = this.createFallbackMessageText(input);
    const subject = this.generateSubject(input);

    return success({
      message,
      subject,
      model: 'fallback-template',
      generatedAt: new Date(),
    });
  }

  private createFallbackMessageText(input: MessageGenerationInput): string {
    const deliveryRef = input.trackingNumber || input.deliveryId;
    return `Dear Valued Customer,

We want to inform you that your delivery (Tracking #: ${deliveryRef}) is experiencing a delay of approximately ${input.delayMinutes} minutes due to ${input.trafficCondition} traffic conditions.

Route: ${input.origin} → ${input.destination}

Original arrival time: ${new Date(input.originalArrival).toLocaleTimeString()}
New estimated arrival: ${new Date(input.estimatedArrival).toLocaleTimeString()}

We sincerely apologize for any inconvenience this delay may cause. Our driver is working to deliver your package as quickly and safely as possible.

Thank you for your patience and understanding.

Best regards,
Freight Delivery Team`;
  }

  private generateSubject(input: MessageGenerationInput): string {
    const deliveryRef = input.trackingNumber || input.deliveryId;
    if (input.delayMinutes > 60) {
      return `Important: Significant Delay - Tracking #${deliveryRef}`;
    } else if (input.delayMinutes > 30) {
      return `Delivery Update: ${input.delayMinutes}-minute delay - #${deliveryRef}`;
    } else {
      return `Minor Delay Notice - Tracking #${deliveryRef}`;
    }
  }
}