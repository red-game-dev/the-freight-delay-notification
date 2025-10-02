/**
 * SendGrid Email Adapter
 * PDF Step 4: Email notification delivery
 */

import sgMail from '@sendgrid/mail';
import { env } from '../../config/EnvValidator';
import { Result, success, failure } from '../../../core/base/utils/Result';
import { InfrastructureError } from '../../../core/base/errors/BaseError';
import { NotificationAdapter, NotificationInput, NotificationResult } from './NotificationAdapter.interface';
import { EmailBlacklistChecker } from '../../../core/shared/constants/email-blacklist';

export class SendGridAdapter implements NotificationAdapter {
  public readonly providerName = 'SendGrid';
  public readonly priority = 1; // Email has higher priority than SMS
  public readonly channel = 'email' as const;

  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = env.SENDGRID_API_KEY || '';
    this.fromEmail = env.SENDGRID_FROM_EMAIL || 'noreply@example.com';
    this.fromName = env.SENDGRID_FROM_NAME || 'Freight Notifications';

    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async send(input: NotificationInput): Promise<Result<NotificationResult>> {
    if (!this.isAvailable()) {
      return failure(new InfrastructureError(
        `${this.providerName} API key not configured`,
        { provider: this.providerName }
      ));
    }

    // Check email blacklist
    if (EmailBlacklistChecker.isBlacklisted(input.to)) {
      const reason = EmailBlacklistChecker.getBlacklistReason(input.to);
      console.log(`⚠️ [${this.providerName}] Email blocked: ${input.to}`);
      console.log(`   Reason: ${reason}`);

      return failure(new InfrastructureError(
        `Email address is blacklisted: ${reason}`,
        {
          provider: this.providerName,
          email: input.to,
          reason
        }
      ));
    }

    try {
      console.log(`📧 [${this.providerName}] Sending email to ${input.to}...`);

      const msg = {
        to: input.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: input.subject || 'Delivery Update',
        text: input.message,
        html: this.formatHtmlEmail(input.message, input.deliveryId),
      };

      const [response] = await sgMail.send(msg);

      console.log(`✅ [${this.providerName}] Email sent successfully`);

      return success({
        success: true,
        messageId: response.headers['x-message-id'] as string,
        channel: this.channel,
      });
    } catch (error: any) {
      console.error(`❌ [${this.providerName}] Error:`, error.message);

      return failure(new InfrastructureError(
        `Failed to send email via ${this.providerName}`,
        {
          error: error.message,
          code: error.code,
          recipient: input.to
        }
      ));
    }
  }

  private formatHtmlEmail(message: string, deliveryId: string): string {
    // Convert plain text to simple HTML
    const paragraphs = message.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delivery Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-left: 4px solid #ff9800; padding: 15px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 10px 0; color: #ff9800;">Delivery Update</h2>
    <p style="margin: 0; color: #666;">Tracking ID: ${deliveryId}</p>
  </div>

  <div style="background-color: white; padding: 20px;">
    ${paragraphs}
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
    <p>This is an automated notification from Freight Delivery System.</p>
    <p>Please do not reply to this email.</p>
  </div>
</body>
</html>`;
  }
}