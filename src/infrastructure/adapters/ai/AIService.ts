/**
 * AI Service
 * Manages AI adapters with automatic fallback
 * Follows the same pattern as TrafficService and NotificationService
 */

import { Result, failure } from '../../../core/base/utils/Result';
import { InfrastructureError } from '../../../core/base/errors/BaseError';
import { AIAdapter, MessageGenerationInput, GeneratedMessage } from './AIAdapter.interface';
import { OpenAIAdapter } from './OpenAIAdapter';
import { MockAIAdapter } from './MockAIAdapter';
import { logger } from '@/core/base/utils/Logger';
import { env } from '../../config/EnvValidator';

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
      .filter(adapter => adapter.isAvailable())
      .sort((a, b) => a.priority - b.priority);

    logger.info('🤖 [AIService] Initialized adapters:');
    logger.info(`   Available: ${this.adapters.map(a => `${a.providerName}(${a.priority})`).join(', ')}`);
  }

  /**
   * Generate AI message with automatic fallback
   */
  async generateMessage(input: MessageGenerationInput): Promise<Result<GeneratedMessage>> {
    if (this.adapters.length === 0) {
      return failure(new InfrastructureError(
        'No AI adapters available',
        { input }
      ));
    }

    logger.info(`\n🤖 [AIService] Generating message for delivery ${input.deliveryId}...`);
    logger.info(`   Trying ${this.adapters.length} adapter(s) in priority order`);

    const errors: Array<{ adapter: string; error: string }> = [];

    // Try each adapter in priority order
    for (const adapter of this.adapters) {
      logger.info(`\n🔄 [AIService] Trying ${adapter.providerName}...`);

      const result = await adapter.generateMessage(input);

      if (result.success) {
        logger.info(`✅ [AIService] Successfully generated message via ${adapter.providerName}`);
        return result;
      }

      // Log failure and try next adapter
      const errorMessage = !result.success ? result.error?.message || 'Unknown error' : 'Unknown error';
      logger.info(`⚠️ [AIService] ${adapter.providerName} failed: ${errorMessage}`);
      errors.push({
        adapter: adapter.providerName,
        error: errorMessage,
      });
    }

    // All adapters failed (this should never happen with MockAIAdapter as fallback)
    logger.error('❌ [AIService] All AI adapters failed');

    return failure(new InfrastructureError(
      'All AI adapters failed',
      {
        attemptedAdapters: errors.map(e => e.adapter),
        errors,
      }
    ));
  }

  /**
   * Get list of available adapters
   */
  getAvailableAdapters(): string[] {
    return this.adapters.map(a => a.providerName);
  }
}