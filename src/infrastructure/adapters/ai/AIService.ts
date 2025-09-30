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

export class AIService {
  private adapters: AIAdapter[] = [];

  constructor() {
    this.initializeAdapters();
  }

  /**
   * Initialize all AI adapters and sort by priority
   */
  private initializeAdapters(): void {
    const allAdapters: AIAdapter[] = [
      new OpenAIAdapter(),
      new MockAIAdapter(),
    ];

    // Filter available adapters and sort by priority
    this.adapters = allAdapters
      .filter(adapter => adapter.isAvailable())
      .sort((a, b) => a.priority - b.priority);

    console.log('🤖 [AIService] Initialized adapters:');
    console.log(`   Available: ${this.adapters.map(a => `${a.providerName}(${a.priority})`).join(', ')}`);
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

    console.log(`\n🤖 [AIService] Generating message for delivery ${input.deliveryId}...`);
    console.log(`   Trying ${this.adapters.length} adapter(s) in priority order`);

    const errors: Array<{ adapter: string; error: string }> = [];

    // Try each adapter in priority order
    for (const adapter of this.adapters) {
      console.log(`\n🔄 [AIService] Trying ${adapter.providerName}...`);

      const result = await adapter.generateMessage(input);

      if (result.success) {
        console.log(`✅ [AIService] Successfully generated message via ${adapter.providerName}`);
        return result;
      }

      // Log failure and try next adapter
      const errorMessage = !result.success ? result.error?.message || 'Unknown error' : 'Unknown error';
      console.log(`⚠️ [AIService] ${adapter.providerName} failed: ${errorMessage}`);
      errors.push({
        adapter: adapter.providerName,
        error: errorMessage,
      });
    }

    // All adapters failed (this should never happen with MockAIAdapter as fallback)
    console.error('❌ [AIService] All AI adapters failed');

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