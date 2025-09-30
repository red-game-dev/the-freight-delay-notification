/**
 * Mock Email Adapter
 * Always-available fallback for testing without real email service
 */

import { Result, success } from '../../../core/base/utils/Result';
import { INotificationAdapter, NotificationInput, NotificationResult } from './NotificationAdapter.interface';

export class MockEmailAdapter implements INotificationAdapter {
  public readonly providerName = 'Mock Email';
  public readonly priority = 999; // Lowest priority - only used as last resort
  public readonly channel = 'email' as const;

  isAvailable(): boolean {
    return true; // Always available for testing
  }

  async send(input: NotificationInput): Promise<Result<NotificationResult>> {
    console.log(`📧 [Mock Email] Simulating email send to ${input.to}`);
    console.log(`   Subject: ${input.subject || 'Delivery Update'}`);
    console.log(`   Message Preview: ${input.message.substring(0, 100)}...`);
    console.log(`   Delivery ID: ${input.deliveryId}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate deterministic mock message ID
    const mockMessageId = `mock-email-${Date.now()}-${input.deliveryId}`;

    console.log(`✅ [Mock Email] Email simulated successfully`);
    console.log(`   Mock Message ID: ${mockMessageId}`);

    return success({
      success: true,
      messageId: mockMessageId,
      channel: this.channel,
    });
  }
}