/**
 * OpenAI Adapter for AI Text Generation
 * Generic adapter that can be used for any text generation task
 */

import OpenAI from "openai";
import { getErrorMessage, logger } from "@/core/base/utils/Logger";
import { failure, type Result, success } from "../../../core/base/utils/Result";
import { env } from "../../config/EnvValidator";
import type {
  AIAdapter,
  AIGenerationInput,
  AIGenerationResult,
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

  /**
   * Generic text generation from prompt
   * Use this for any AI generation task
   */
  async generateText(
    input: AIGenerationInput,
  ): Promise<Result<AIGenerationResult>> {
    if (!this.isAvailable()) {
      logger.warn(
        `⚠️ ${this.providerName} API key not configured - cannot generate text`,
      );
      return failure(new Error(`${this.providerName} API key not configured`));
    }

    try {
      const contextLog = input.context
        ? ` (${input.context.type || "unknown"} - ${input.context.deliveryId || "no-id"})`
        : "";
      logger.info(
        `🤖 [${this.providerName}] Generating text${contextLog} with ${this.model}...`,
      );

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      // Add system message if provided
      if (input.systemPrompt) {
        messages.push({
          role: "system",
          content: input.systemPrompt,
        });
      }

      // Add user prompt
      messages.push({
        role: "user",
        content: input.prompt,
      });

      const completion = await this.client?.chat.completions.create({
        model: this.model,
        messages,
        temperature: input.temperature ?? 0.7,
        max_tokens: input.maxTokens ?? 150,
      });

      if (!completion || !completion.choices[0].message.content) {
        logger.warn(
          `⚠️ ${this.providerName} returned empty response - generation failed`,
        );
        return failure(
          new Error(`${this.providerName} returned empty response`),
        );
      }

      const text = completion.choices[0].message.content;

      logger.info(`✅ [${this.providerName}] Text generated successfully`);
      logger.info(`   Model: ${this.model}`);
      logger.info(`   Tokens: ${completion.usage?.total_tokens || "unknown"}`);

      return success({
        text,
        model: this.model,
        tokens: completion.usage?.total_tokens,
        generatedAt: new Date(),
        fallbackUsed: false,
      });
    } catch (error: unknown) {
      logger.error(
        `❌ ${this.providerName} API error:`,
        getErrorMessage(error),
      );
      return failure(
        new Error(
          `${this.providerName} generation failed: ${getErrorMessage(error)}`,
        ),
      );
    }
  }
}
