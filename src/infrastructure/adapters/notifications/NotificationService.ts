/**
 * Notification Service
 * Manages notification adapters with automatic fallback
 * Follows the same pattern as TrafficService
 */

import { Result, failure } from '../../../core/base/utils/Result';
import { InfrastructureError } from '../../../core/base/errors/BaseError';
import {
  INotificationAdapter,
  NotificationInput,
  NotificationResult,
  NotificationChannel,
} from './NotificationAdapter.interface';
import { SendGridAdapter } from './SendGridAdapter';
import { TwilioAdapter } from './TwilioAdapter';
import { MockEmailAdapter } from './MockEmailAdapter';
import { MockSMSAdapter } from './MockSMSAdapter';

export class NotificationService {
  private emailAdapters: INotificationAdapter[] = [];
  private smsAdapters: INotificationAdapter[] = [];

  constructor() {
    this.initializeAdapters();
  }

  /**
   * Initialize all notification adapters and sort by priority
   */
  private initializeAdapters(): void {
    const allAdapters: INotificationAdapter[] = [
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

    console.log('📬 [NotificationService] Initialized adapters:');
    console.log(`   Email adapters: ${this.emailAdapters.map(a => `${a.providerName}(${a.priority})`).join(', ')}`);
    console.log(`   SMS adapters: ${this.smsAdapters.map(a => `${a.providerName}(${a.priority})`).join(', ')}`);
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

    console.log(`\n📤 [NotificationService] Sending ${channel} notification...`);
    console.log(`   Trying ${adapters.length} adapter(s) in priority order`);

    const errors: Array<{ adapter: string; error: string }> = [];

    // Try each adapter in priority order
    for (const adapter of adapters) {
      console.log(`\n🔄 [NotificationService] Trying ${adapter.providerName}...`);

      const result = await adapter.send(input);

      if (result.success) {
        console.log(`✅ [NotificationService] Successfully sent via ${adapter.providerName}`);
        return result;
      }

      // Log failure and try next adapter
      const errorMessage = !result.success ? result.error?.message || 'Unknown error' : 'Unknown error';
      console.log(`⚠️ [NotificationService] ${adapter.providerName} failed: ${errorMessage}`);
      errors.push({
        adapter: adapter.providerName,
        error: errorMessage,
      });
    }

    // All adapters failed
    console.error(`❌ [NotificationService] All ${channel} adapters failed`);

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
    console.log('\n📬 [NotificationService] Sending notifications via both channels...');

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