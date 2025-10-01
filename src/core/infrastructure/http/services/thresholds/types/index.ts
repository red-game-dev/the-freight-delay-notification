/**
 * Threshold Types
 * Type definitions for threshold-related operations
 */

export interface Threshold {
  id: string;
  name: string;
  delay_minutes: number;
  notification_channels: Array<'email' | 'sms'>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateThresholdInput {
  name: string;
  delay_minutes: number;
  notification_channels: Array<'email' | 'sms'>;
  is_default?: boolean;
}

export interface UpdateThresholdInput extends Partial<CreateThresholdInput> {}
