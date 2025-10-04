/**
 * Mock Email Adapter
 * Always-available fallback for testing without real email service
 */

import { logger } from "@/core/base/utils/Logger";
import { type Result, success } from "../../../core/base/utils/Result";
import type {
  NotificationAdapter,
  NotificationInput,
  NotificationResult,
} from "./NotificationAdapter.interface";

export class MockEmailAdapter implements NotificationAdapter {
  public readonly providerName = "Mock Email";
  public readonly priority = 999; // Lowest priority - only used as last resort
  public readonly channel = "email" as const;

  isAvailable(): boolean {
    return true; // Always available for testing
  }

  async send(input: NotificationInput): Promise<Result<NotificationResult>> {
    logger.info(`📧 [Mock Email] Simulating email send to ${input.to}`);
    logger.info(`   Subject: ${input.subject || "Delivery Update"}`);
    logger.info(`   Message Preview: ${input.message.substring(0, 100)}...`);
    logger.info(`   Delivery ID: ${input.deliveryId}`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate deterministic mock message ID
    const mockMessageId = `mock-email-${Date.now()}-${input.deliveryId}`;

    logger.info(`✅ [Mock Email] Email simulated successfully`);
    logger.info(`   Mock Message ID: ${mockMessageId}`);

    return success({
      success: true,
      messageId: mockMessageId,
      channel: this.channel,
    });
  }
}
