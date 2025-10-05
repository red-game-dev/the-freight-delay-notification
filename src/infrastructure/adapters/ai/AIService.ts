/**
 * AI Service
 * Manages AI adapters with automatic fallback
 * Follows the same pattern as TrafficService and NotificationService
 */

import { logger } from "@/core/base/utils/Logger";
import { InfrastructureError } from "../../../core/base/errors/BaseError";
import { failure, type Result } from "../../../core/base/utils/Result";
import { env } from "../../config/EnvValidator";
import type {
  AIAdapter,
  AIGenerationInput,
  AIGenerationResult,
} from "./AIAdapter.interface";
import { MockAIAdapter } from "./MockAIAdapter";
import { OpenAIAdapter } from "./OpenAIAdapter";

export class AIService {
  private adapters: AIAdapter[] = [];

  constructor() {
    this.initializeAdapters();
  }

  /**
   * Initialize all AI adapters and sort by priority
   */
  private initializeAdapters(): void {
    // Check if we should force use of MockAIAdapter for testing
    if (env.FORCE_AI_MOCK_ADAPTER) {
      logger.info(`🧪 [AIService] TESTING MODE: Forcing MockAIAdapter`);
      this.adapters = [new MockAIAdapter()];
      return;
    }

    // Add all available adapters
    const allAdapters: AIAdapter[] = [
      new OpenAIAdapter(), // Priority 1 - gpt-4o-mini for personalized messages
      new MockAIAdapter(), // Priority 999 - Template fallback
    ];

    // Filter available adapters and sort by priority
    this.adapters = allAdapters
      .filter((adapter) => adapter.isAvailable())
      .sort((a, b) => a.priority - b.priority);

    logger.info("🤖 [AIService] Initialized adapters:");
    logger.info(
      `   Available: ${this.adapters.map((a) => `${a.providerName}(${a.priority})`).join(", ")}`,
    );
  }

  /**
   * Generic text generation with automatic fallback
   * Use this for any AI text generation task with custom prompts
   *
   * @param input - Prompt and generation parameters
   * @returns Generated text or error
   */
  async generateText(
    input: AIGenerationInput,
  ): Promise<Result<AIGenerationResult>> {
    if (this.adapters.length === 0) {
      return failure(
        new InfrastructureError("No AI adapters available", { input }),
      );
    }

    const contextLog = input.context
      ? ` for ${input.context.type || "unknown"} (${input.context.deliveryId || "no-id"})`
      : "";
    logger.info(`\n🤖 [AIService] Generating text${contextLog}...`);
    logger.info(
      `   Trying ${this.adapters.length} adapter(s) in priority order`,
    );

    const errors: Array<{ adapter: string; error: string }> = [];

    // Try each adapter in priority order
    for (const adapter of this.adapters) {
      logger.info(`\n🔄 [AIService] Trying ${adapter.providerName}...`);

      const result = await adapter.generateText(input);

      if (result.success) {
        logger.info(
          `✅ [AIService] Successfully generated text via ${adapter.providerName}`,
        );
        return result;
      }

      // Log failure and try next adapter
      const errorMessage = !result.success
        ? result.error?.message || "Unknown error"
        : "Unknown error";
      logger.info(
        `⚠️ [AIService] ${adapter.providerName} failed: ${errorMessage}`,
      );
      errors.push({
        adapter: adapter.providerName,
        error: errorMessage,
      });
    }

    // All adapters failed
    logger.error("❌ [AIService] All AI adapters failed");

    return failure(
      new InfrastructureError("All AI adapters failed", {
        attemptedAdapters: errors.map((e) => e.adapter),
        errors,
      }),
    );
  }

  /**
   * Get list of available adapters
   */
  getAvailableAdapters(): string[] {
    return this.adapters.map((a) => a.providerName);
  }
}
