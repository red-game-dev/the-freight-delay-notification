-- Add thresholds table for delay notification thresholds
-- Migration: 20240101000003_add_thresholds

-- Thresholds table
CREATE TABLE thresholds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  delay_minutes INTEGER NOT NULL CHECK (delay_minutes > 0),
  notification_channels TEXT[] NOT NULL CHECK (array_length(notification_channels, 1) > 0),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for default threshold lookup
CREATE INDEX idx_thresholds_is_default ON thresholds(is_default) WHERE is_default = TRUE;

-- Trigger for updated_at timestamps
CREATE TRIGGER update_thresholds_updated_at BEFORE UPDATE ON thresholds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one default threshold exists
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

-- Trigger to enforce single default
CREATE TRIGGER ensure_single_default_threshold
  BEFORE INSERT OR UPDATE ON thresholds
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION enforce_single_default_threshold();

-- Add default threshold
INSERT INTO thresholds (name, delay_minutes, notification_channels, is_default)
VALUES ('Standard Threshold', 30, ARRAY['email'], TRUE);

-- Add comment
COMMENT ON TABLE thresholds IS 'Delay notification thresholds configuration';
COMMENT ON COLUMN thresholds.notification_channels IS 'Array of notification channels (email, sms)';
COMMENT ON COLUMN thresholds.is_default IS 'Only one threshold can be marked as default at a time';
