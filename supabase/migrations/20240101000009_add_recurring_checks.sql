-- Add recurring check configuration fields to deliveries table
-- This enables scheduled recurring traffic checks until delivery completion

ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS enable_recurring_checks BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS check_interval_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS max_checks INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS checks_performed INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN deliveries.enable_recurring_checks IS 'When true, traffic is checked repeatedly at configured intervals';
COMMENT ON COLUMN deliveries.check_interval_minutes IS 'Interval between recurring traffic checks (in minutes)';
COMMENT ON COLUMN deliveries.max_checks IS 'Maximum number of recurring checks to perform (1-100)';
COMMENT ON COLUMN deliveries.checks_performed IS 'Number of checks already performed (auto-incremented)';

-- Add check constraint for valid values (original constraints)
ALTER TABLE deliveries
ADD CONSTRAINT check_interval_minutes_range CHECK (check_interval_minutes >= 1 AND check_interval_minutes <= 1440),
ADD CONSTRAINT max_checks_range CHECK (max_checks >= 1 AND max_checks <= 100);
