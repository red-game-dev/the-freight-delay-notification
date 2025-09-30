/**
 * Twilio SMS Adapter
 * PDF Step 4: SMS notification delivery
 */

import { Twilio } from 'twilio';
import { env } from '../../config/EnvValidator';
import { Result, success, failure } from '../../../core/base/utils/Result';
import { InfrastructureError } from '../../../core/base/errors/BaseError';
import { NotificationAdapter, NotificationInput, NotificationResult } from './NotificationAdapter.interface';

export class TwilioAdapter implements NotificationAdapter {
  public readonly providerName = 'Twilio';
  public readonly priority = 2; // SMS has lower priority than email
  public readonly channel = 'sms' as const;

  private client: Twilio | null = null;
  private fromPhone: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromPhone = process.env.TWILIO_FROM_PHONE || '';

    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
    }
  }

  isAvailable(): boolean {
    return !!this.client && !!this.fromPhone;
  }

  async send(input: NotificationInput): Promise<Result<NotificationResult>> {
    if (!this.isAvailable()) {
      console.log('⚠️ Twilio credentials not configured');
      return failure(new InfrastructureError(
        'Twilio credentials not configured',
        { provider: 'twilio' }
      ));
    }

    try {
      console.log(`📱 [Twilio] Sending SMS to ${input.to}...`);

      // Truncate message if too long (SMS has 160 char limit per segment)
      const smsMessage = this.formatSMSMessage(input.message, input.deliveryId);

      const message = await this.client!.messages.create({
        body: smsMessage,
        from: this.fromPhone,
        to: input.to,
      });

      console.log(`✅ [Twilio] SMS sent successfully`);
      console.log(`   Message SID: ${message.sid}`);
      console.log(`   Status: ${message.status}`);

      return success({
        success: true,
        messageId: message.sid,
        channel: this.channel,
      });
    } catch (error: any) {
      console.error('❌ [Twilio] Error:', error.message);

      return failure(new InfrastructureError(
        'Failed to send SMS via Twilio',
        {
          error: error.message,
          code: error.code,
          recipient: input.to
        }
      ));
    }
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