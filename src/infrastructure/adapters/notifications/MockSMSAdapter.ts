/**
 * Mock SMS Adapter
 * Always-available fallback for testing without real SMS service
 */

import { Result, success } from '../../../core/base/utils/Result';
import { NotificationAdapter, NotificationInput, NotificationResult } from './NotificationAdapter.interface';

export class MockSMSAdapter implements NotificationAdapter {
  public readonly providerName = 'Mock SMS';
  public readonly priority = 999; // Lowest priority - only used as last resort
  public readonly channel = 'sms' as const;

  isAvailable(): boolean {
    return true; // Always available for testing
  }

  async send(input: NotificationInput): Promise<Result<NotificationResult>> {
    console.log(`📱 [Mock SMS] Simulating SMS send to ${input.to}`);

    // Format SMS message (same logic as real TwilioAdapter)
    const smsMessage = this.formatSMSMessage(input.message, input.deliveryId);
    console.log(`   Message: ${smsMessage}`);
    console.log(`   Length: ${smsMessage.length} characters`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate deterministic mock message ID
    const mockMessageId = `mock-sms-${Date.now()}-${input.deliveryId}`;

    console.log(`✅ [Mock SMS] SMS simulated successfully`);
    console.log(`   Mock Message ID: ${mockMessageId}`);

    return success({
      success: true,
      messageId: mockMessageId,
      channel: this.channel,
    });
  }

  private formatSMSMessage(message: string, deliveryId: string): string {
    // For SMS, keep it short and concise
    const lines = message.split('\n').filter(line => line.trim());

    // Extract key information
    const shortMessage = `Delivery ${deliveryId} Update: ${lines.slice(0, 2).join(' ')}`;

    // Limit to 160 characters for single SMS
    if (shortMessage.length <= 160) {
      return shortMessage;
    }

    return shortMessage.substring(0, 157) + '...';
  }
}