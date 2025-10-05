/**
 * Mock AI Adapter
 * Always-available fallback for testing without real AI service
 */

import { logger } from "@/core/base/utils/Logger";
import { type Result, success } from "../../../core/base/utils/Result";
import type {
  AIAdapter,
  AIGenerationInput,
  AIGenerationResult,
} from "./AIAdapter.interface";

export class MockAIAdapter implements AIAdapter {
  public readonly providerName = "Mock AI";
  public readonly priority = 999; // Lowest priority - only used as last resort

  isAvailable(): boolean {
    return true; // Always available for testing
  }

  /**
   * Generic text generation (returns simple templated response)
   */
  async generateText(
    input: AIGenerationInput,
  ): Promise<Result<AIGenerationResult>> {
    const contextLog = input.context
      ? ` (${input.context.type || "unknown"} - ${input.context.deliveryId || "no-id"})`
      : "";
    logger.info(`🤖 [${this.providerName}] Generating mock text${contextLog}`);

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simple template: Just echo the prompt with a prefix
    const text = `[Mock AI Response] ${input.prompt.substring(0, 200)}...`;

    logger.info(`✅ [${this.providerName}] Mock text generated`);

    return success({
      text,
      model: "mock-template",
      tokens: text.length,
      generatedAt: new Date(),
      fallbackUsed: true,
    });
  }
}
