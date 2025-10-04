/**
 * Twilio SMS Adapter
 * PDF Step 4: SMS notification delivery
 */

import { Twilio } from "twilio";
import { getErrorMessage, hasCode, logger } from "@/core/base/utils/Logger";
import { InfrastructureError } from "../../../core/base/errors/BaseError";
import { failure, type Result, success } from "../../../core/base/utils/Result";
import { env } from "../../config/EnvValidator";
import type {
  NotificationAdapter,
  NotificationInput,
  NotificationResult,
} from "./NotificationAdapter.interface";

export class TwilioAdapter implements NotificationAdapter {
  public readonly providerName = "Twilio";
  public readonly priority = 2; // SMS has lower priority than email
  public readonly channel = "sms" as const;

  private client: Twilio | null = null;
  private fromPhone: string;

  constructor() {
    const accountSid = env.TWILIO_ACCOUNT_SID || "";
    const authToken = env.TWILIO_AUTH_TOKEN || "";
    this.fromPhone = env.TWILIO_FROM_PHONE || "";

    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
    }
  }

  isAvailable(): boolean {
    return !!this.client && !!this.fromPhone;
  }

  async send(input: NotificationInput): Promise<Result<NotificationResult>> {
    if (!this.isAvailable()) {
      logger.info("⚠️ Twilio credentials not configured");
      return failure(
        new InfrastructureError("Twilio credentials not configured", {
          provider: "twilio",
        }),
      );
    }

    try {
      logger.info(`📱 [Twilio] Sending SMS to ${input.to}...`);

      // Truncate message if too long (SMS has 160 char limit per segment)
      const smsMessage = this.formatSMSMessage(input.message, input.deliveryId);

      const message = await this.client?.messages.create({
        body: smsMessage,
        from: this.fromPhone,
        to: input.to,
      });

      logger.info(`✅ [Twilio] SMS sent successfully`);
      logger.info(`   Message SID: ${message?.sid}`);
      logger.info(`   Status: ${message?.status}`);

      return success({
        success: true,
        messageId: message?.sid,
        channel: this.channel,
      });
    } catch (error: unknown) {
      logger.error("❌ [Twilio] Error:", getErrorMessage(error));

      return failure(
        new InfrastructureError("Failed to send SMS via Twilio", {
          error: getErrorMessage(error),
          code: hasCode(error) ? error.code : undefined,
          recipient: input.to,
        }),
      );
    }
  }

  private formatSMSMessage(message: string, deliveryId: string): string {
    // For SMS, keep it short and concise
    const lines = message.split("\n").filter((line) => line.trim());

    // Extract key information
    const shortMessage = `Delivery ${deliveryId} Update: ${lines.slice(0, 2).join(" ")}`;

    // Limit to 160 characters for single SMS
    if (shortMessage.length <= 160) {
      return shortMessage;
    }

    return `${shortMessage.substring(0, 157)}...`;
  }
}
