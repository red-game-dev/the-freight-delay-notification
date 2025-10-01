/**
 * Add Notification Deduplication Settings
 * Add fields to control notification spam prevention per delivery
 */

-- Add notification deduplication fields to deliveries table
ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS min_delay_change_threshold INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS min_hours_between_notifications DECIMAL(3,1) DEFAULT 1.0;

-- Add comments
COMMENT ON COLUMN deliveries.min_delay_change_threshold IS 'Minimum delay change (in minutes) required to trigger a new notification. Default: 15 minutes';
COMMENT ON COLUMN deliveries.min_hours_between_notifications IS 'Minimum hours that must pass before sending another notification for similar delay. Default: 1.0 hours';

-- Add constraints
ALTER TABLE deliveries
ADD CONSTRAINT min_delay_change_threshold_range CHECK (min_delay_change_threshold >= 5 AND min_delay_change_threshold <= 120),
ADD CONSTRAINT min_hours_between_notifications_range CHECK (min_hours_between_notifications >= 0.5 AND min_hours_between_notifications <= 24);
