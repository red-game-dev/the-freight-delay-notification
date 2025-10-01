-- Add missing fields to match PRD requirements

-- Create priority enum if not exists
DO $$ BEGIN
  CREATE TYPE delivery_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add missing fields to customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Add missing fields to routes table
ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS waypoints JSONB DEFAULT '[]';

-- Add missing fields to deliveries table
ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS priority delivery_priority DEFAULT 'normal';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_deliveries_priority ON deliveries(priority);
CREATE INDEX IF NOT EXISTS idx_customers_email_verified ON customers(email_verified);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);
