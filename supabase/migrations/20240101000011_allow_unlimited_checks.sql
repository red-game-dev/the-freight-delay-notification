/**
 * Allow Unlimited Recurring Checks
 * Update max_checks constraint to allow -1 for unlimited checks
 */

-- Drop existing max_checks constraint
ALTER TABLE deliveries
DROP CONSTRAINT IF EXISTS max_checks_range;

-- Add new constraint that allows -1 (unlimited) or 1-1000
ALTER TABLE deliveries
ADD CONSTRAINT max_checks_range CHECK (max_checks = -1 OR (max_checks >= 1 AND max_checks <= 1000));

-- Update the comment to reflect the new constraint
COMMENT ON COLUMN deliveries.max_checks IS 'Maximum number of recurring checks. -1 means unlimited, otherwise 1-1000';
