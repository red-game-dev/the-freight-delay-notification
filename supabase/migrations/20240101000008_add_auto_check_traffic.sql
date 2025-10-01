-- Add auto_check_traffic field to deliveries table
-- This allows deliveries to automatically trigger workflow on creation

ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS auto_check_traffic BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN deliveries.auto_check_traffic IS 'When true, workflow is automatically triggered on delivery creation';
