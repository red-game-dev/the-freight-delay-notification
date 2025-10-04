-- Add recipient column to notifications table
-- This column stores the email address or phone number where the notification was sent

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS recipient VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN notifications.recipient IS 'Email address or phone number where notification was sent';
