/**
 * AI Adapter Interface
 * Defines the contract for all AI text generation providers
 *
 * This is a generic interface that can be used for any AI text generation task,
 * not just delay notifications. Specific use cases (email, SMS, etc.) should
 * build their own prompts and pass them to generateText().
 */

import type { Result } from "../../../core/base/utils/Result";

/**
 * Generic AI text generation input
 */
export interface AIGenerationInput {
  /**
   * The prompt/instruction for the AI model
   */
  prompt: string;

  /**
   * System message (optional) - sets the AI's behavior/role
   */
  systemPrompt?: string;

  /**
   * Maximum tokens to generate (optional)
   */
  maxTokens?: number;

  /**
   * Temperature for randomness 0.0-2.0 (optional, default: 0.7)
   */
  temperature?: number;

  /**
   * Context for logging/tracking (optional)
   */
  context?: {
    deliveryId?: string;
    type?: string; // 'email', 'sms', 'custom'
    [key: string]: unknown;
  };
}

/**
 * Generic AI text generation output
 */
export interface AIGenerationResult {
  /**
   * The generated text
   */
  text: string;

  /**
   * Model used for generation
   */
  model: string;

  /**
   * Tokens used (if available)
   */
  tokens?: number;

  /**
   * When the text was generated
   */
  generatedAt: Date;

  /**
   * Whether a fallback/template was used instead of AI
   */
  fallbackUsed?: boolean;
}

/**
 * AI Adapter Interface
 * Generic text generation provider for any use case
 */
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
   * Generate text from a prompt (generic method)
   * Use this for any AI generation task with custom prompts
   */
  generateText(input: AIGenerationInput): Promise<Result<AIGenerationResult>>;
}
