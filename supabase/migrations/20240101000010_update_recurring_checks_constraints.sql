-- Update recurring checks constraints to support longer intervals
-- This migration extends the check_interval and max_checks ranges

-- Drop existing constraints
ALTER TABLE deliveries
DROP CONSTRAINT IF EXISTS check_interval_minutes_range,
DROP CONSTRAINT IF EXISTS max_checks_range;

-- Add new constraints with extended ranges
ALTER TABLE deliveries
ADD CONSTRAINT check_interval_minutes_range CHECK (check_interval_minutes >= 1 AND check_interval_minutes <= 43200),
ADD CONSTRAINT max_checks_range CHECK (max_checks >= 1 AND max_checks <= 1000);

-- Update comments for documentation
COMMENT ON COLUMN deliveries.check_interval_minutes IS 'Interval between recurring traffic checks (in minutes). Supports: 15min, 30min, 1-12hr, daily (1440), weekly (10080), monthly (43200)';
COMMENT ON COLUMN deliveries.max_checks IS 'Maximum number of recurring checks to perform (1-1000)';
