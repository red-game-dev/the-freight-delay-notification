-- Add is_system column to thresholds table
-- Migration: 20250105000008_add_is_system_to_thresholds
-- This column marks system-managed thresholds that cannot be edited or deleted

-- Add is_system column
ALTER TABLE thresholds
ADD COLUMN is_system BOOLEAN DEFAULT FALSE NOT NULL;

-- Mark the default "Standard Threshold" as a system threshold
UPDATE thresholds
SET is_system = TRUE
WHERE name = 'Standard Threshold' AND is_default = TRUE;

-- Create index for querying non-system thresholds
CREATE INDEX idx_thresholds_is_system ON thresholds(is_system) WHERE is_system = FALSE;

-- Add comment
COMMENT ON COLUMN thresholds.is_system IS 'System thresholds cannot be edited or deleted by users';

-- Update the enforce_single_default_threshold function to handle system thresholds
-- (System thresholds can still be default, but user thresholds can override them)
CREATE OR REPLACE FUNCTION enforce_single_default_threshold()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a threshold as default, unset all others
  IF NEW.is_default = TRUE THEN
    UPDATE thresholds
    SET is_default = FALSE
    WHERE id != NEW.id AND is_default = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
