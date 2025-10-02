-- Add execution tracking fields to notifications table
-- These fields help track when notification attempts were made and how many times

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS attempted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_details JSONB DEFAULT '{}';

-- Add comment explaining the fields
COMMENT ON COLUMN notifications.attempted_at IS 'Timestamp when the notification execution was first attempted (may differ from sent_at if failed)';
COMMENT ON COLUMN notifications.retry_count IS 'Number of times the notification delivery was retried';
COMMENT ON COLUMN notifications.error_details IS 'Comprehensive error information including stack traces, provider responses, and retry history';

-- Add index for performance on attempted_at
CREATE INDEX IF NOT EXISTS idx_notifications_attempted_at ON notifications(attempted_at);
