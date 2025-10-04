/**
 * Notification Service
 * Manages notification adapters with automatic fallback
 * Follows the same pattern as TrafficService
 */

import { Result, failure } from '../../../core/base/utils/Result';
import { InfrastructureError } from '../../../core/base/errors/BaseError';
import {
  NotificationAdapter,
  NotificationInput,
  NotificationResult,
} from './NotificationAdapter.interface';
import type { NotificationChannel } from '@/core/types';
import { SendGridAdapter } from './SendGridAdapter';
import { TwilioAdapter } from './TwilioAdapter';
import { MockEmailAdapter } from './MockEmailAdapter';
import { MockSMSAdapter } from './MockSMSAdapter';
import { logger } from '@/core/base/utils/Logger';
import { env } from '../../config/EnvValidator';

export class NotificationService {
  private emailAdapters: NotificationAdapter[] = [];
  private smsAdapters: NotificationAdapter[] = [];

  constructor() {
    this.initializeAdapters();
  }

  /**
   * Initialize all notification adapters and sort by priority
   */
  private initializeAdapters(): void {
    // Check if we should force use of MockNotificationAdapter for testing
    if (env.FORCE_NOTIFICATION_MOCK_ADAPTER) {
      logger.info(`🧪 [NotificationService] TESTING MODE: Forcing Mock adapters`);
      this.emailAdapters = [new MockEmailAdapter()];
      this.smsAdapters = [new MockSMSAdapter()];
      logger.info('📬 [NotificationService] Initialized adapters (TESTING MODE):');
      logger.info(`   Email adapters: ${this.emailAdapters.map(a => `${a.providerName}(${a.priority})`).join(', ')}`);
      logger.info(`   SMS adapters: ${this.smsAdapters.map(a => `${a.providerName}(${a.priority})`).join(', ')}`);
      return;
    }

    // Add all available adapters
    const allAdapters: NotificationAdapter[] = [
      new SendGridAdapter(),
      new TwilioAdapter(),
      new MockEmailAdapter(),
      new MockSMSAdapter(),
    ];

    // Separate by channel and filter available
    this.emailAdapters = allAdapters
      .filter(adapter => adapter.channel === 'email' && adapter.isAvailable())
      .sort((a, b) => a.priority - b.priority);

    this.smsAdapters = allAdapters
      .filter(adapter => adapter.channel === 'sms' && adapter.isAvailable())
      .sort((a, b) => a.priority - b.priority);

    logger.info('📬 [NotificationService] Initialized adapters:');
    logger.info(`   Email adapters: ${this.emailAdapters.map(a => `${a.providerName}(${a.priority})`).join(', ')}`);
    logger.info(`   SMS adapters: ${this.smsAdapters.map(a => `${a.providerName}(${a.priority})`).join(', ')}`);
  }

  /**
   * Send notification through the appropriate channel with automatic fallback
   */
  async send(input: NotificationInput, channel: NotificationChannel): Promise<Result<NotificationResult>> {
    const adapters = channel === 'email' ? this.emailAdapters : this.smsAdapters;

    if (adapters.length === 0) {
      return failure(new InfrastructureError(
        `No ${channel} adapters available`,
        { channel }
      ));
    }

    logger.info(`\n📤 [NotificationService] Sending ${channel} notification...`);
    logger.info(`   Trying ${adapters.length} adapter(s) in priority order`);

    const errors: Array<{ adapter: string; error: string }> = [];

    // Try each adapter in priority order
    for (const adapter of adapters) {
      logger.info(`\n🔄 [NotificationService] Trying ${adapter.providerName}...`);

      const result = await adapter.send(input);

      if (result.success) {
        logger.info(`✅ [NotificationService] Successfully sent via ${adapter.providerName}`);
        return result;
      }

      // Log failure and try next adapter
      const errorMessage = !result.success ? result.error?.message || 'Unknown error' : 'Unknown error';
      logger.info(`⚠️ [NotificationService] ${adapter.providerName} failed: ${errorMessage}`);
      errors.push({
        adapter: adapter.providerName,
        error: errorMessage,
      });
    }

    // All adapters failed
    logger.error(`❌ [NotificationService] All ${channel} adapters failed`);

    return failure(new InfrastructureError(
      `All ${channel} notification adapters failed`,
      {
        channel,
        attemptedAdapters: errors.map(e => e.adapter),
        errors,
      }
    ));
  }

  /**
   * Send both email and SMS notifications
   * Returns results for both channels
   */
  async sendBoth(input: NotificationInput): Promise<{
    email: Result<NotificationResult>;
    sms: Result<NotificationResult>;
  }> {
    logger.info('\n📬 [NotificationService] Sending notifications via both channels...');

    // Send both in parallel
    const [emailResult, smsResult] = await Promise.all([
      this.send(input, 'email'),
      this.send(input, 'sms'),
    ]);

    return {
      email: emailResult,
      sms: smsResult,
    };
  }

  /**
   * Get list of available adapters for a channel
   */
  getAvailableAdapters(channel: NotificationChannel): string[] {
    const adapters = channel === 'email' ? this.emailAdapters : this.smsAdapters;
    return adapters.map(a => a.providerName);
  }
}