/**
 * OpenAI Adapter for AI Message Generation
 * PDF Step 3: Generate notification message using GPT-4o-mini
 */

import OpenAI from "openai";
import { getErrorMessage, logger } from "@/core/base/utils/Logger";
import { type Result, success } from "../../../core/base/utils/Result";
import { env } from "../../config/EnvValidator";
import type {
  AIAdapter,
  GeneratedMessage,
  MessageGenerationInput,
} from "./AIAdapter.interface";

export class OpenAIAdapter implements AIAdapter {
  public readonly providerName = "OpenAI";
  public readonly priority = 1; // Primary AI provider

  private client: OpenAI | null = null;
  private readonly model = "gpt-4o-mini"; // As specified in PDF

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

  async generateMessage(
    input: MessageGenerationInput,
  ): Promise<Result<GeneratedMessage>> {
    if (!this.isAvailable()) {
      logger.info("⚠️ OpenAI API key not configured, using fallback message");
      return this.generateFallbackMessage(input);
    }

    try {
      logger.info(`🤖 [Step 3] Generating AI message with ${this.model}...`);

      const prompt = this.createPrompt(input);

      // Note: In some scenarios, it's better to use JSON output (response_format: { type: "json_object" })
      // to extract structured data for further manipulation (e.g., translation, formatting, A/B testing).
      // However, in this case, we don't manipulate the message afterwards - it's sent directly to the customer.
      // Plain text is simpler and sufficient for our SMS notification use case.
      const completion = await this.client!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a freight delivery notification system. Generate VERY SHORT, friendly traffic delay messages under 160 characters for SMS. Be direct, clear, and concise. No greetings or sign-offs.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 80, // Shorter max tokens for concise SMS messages
      });

      const message =
        completion.choices[0].message.content ||
        this.createFallbackMessageText(input);
      const subject = this.generateSubject(input);

      logger.info(`✅ [Step 3] AI message generated successfully`);
      logger.info(`   Model: ${this.model}`);
      logger.info(`   Tokens: ${completion.usage?.total_tokens || "unknown"}`);

      return success({
        message,
        subject,
        model: this.model,
        tokens: completion.usage?.total_tokens,
        generatedAt: new Date(),
      });
    } catch (error: unknown) {
      logger.error("❌ OpenAI API error:", getErrorMessage(error));

      // Fallback to template message
      return this.generateFallbackMessage(input);
    }
  }

  private createPrompt(input: MessageGenerationInput): string {
    const deliveryRef = input.trackingNumber || input.deliveryId;
    const newETA = new Date(input.estimatedArrival).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `Generate a friendly, concise traffic delay notification for:

Route: ${input.origin} → ${input.destination}
Tracking: ${deliveryRef}
Delay: ${input.delayMinutes} min
Traffic: ${input.trafficCondition}
New ETA: ${newETA}

Create a SHORT message (max 160 characters for SMS compatibility) that:
1. Mentions the route (origin to destination)
2. Includes tracking number
3. States the delay duration
4. Provides new arrival time

Keep it friendly but VERY brief. No formalities. Direct and clear.

Example format: "${input.origin}→${input.destination} - ${deliveryRef}: ${input.delayMinutes}min delay, ${input.trafficCondition} traffic. ETA ${newETA}"

Generate a similar concise message with slight variations.`;
  }

  private generateFallbackMessage(
    input: MessageGenerationInput,
  ): Result<GeneratedMessage> {
    logger.info("📝 Using fallback message template");

    const message = this.createFallbackMessageText(input);
    const subject = this.generateSubject(input);

    return success({
      message,
      subject,
      model: "fallback-template",
      generatedAt: new Date(),
    });
  }

  private createFallbackMessageText(input: MessageGenerationInput): string {
    const deliveryRef = input.trackingNumber || input.deliveryId;
    const newETA = new Date(input.estimatedArrival).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // SMS-friendly short message (under 160 characters) with route
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
