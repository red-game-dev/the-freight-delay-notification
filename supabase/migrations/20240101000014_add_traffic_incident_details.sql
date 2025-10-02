-- Add traffic incident details to traffic_snapshots table
-- These fields provide comprehensive information about traffic conditions for display on maps and monitoring

-- Create enum for incident types (only if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE incident_type AS ENUM (
    'accident',
    'construction',
    'road_closure',
    'weather',
    'congestion',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE traffic_snapshots
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'minor',
  ADD COLUMN IF NOT EXISTS affected_area TEXT,
  ADD COLUMN IF NOT EXISTS incident_type incident_type DEFAULT 'congestion',
  ADD COLUMN IF NOT EXISTS incident_location POINT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add comments explaining the fields
COMMENT ON COLUMN traffic_snapshots.description IS 'Human-readable description of the traffic incident or condition';
COMMENT ON COLUMN traffic_snapshots.severity IS 'Severity level: minor, moderate, major, severe';
COMMENT ON COLUMN traffic_snapshots.affected_area IS 'Text description of the affected road/area (e.g., "I-95 Northbound near Exit 42")';
COMMENT ON COLUMN traffic_snapshots.incident_type IS 'Type of traffic incident causing the delay';
COMMENT ON COLUMN traffic_snapshots.incident_location IS 'Geographic coordinates of the incident for mapping';
COMMENT ON COLUMN traffic_snapshots.metadata IS 'Additional incident data (provider-specific information, affected lanes, etc.)';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_traffic_snapshots_severity ON traffic_snapshots(severity);
CREATE INDEX IF NOT EXISTS idx_traffic_snapshots_incident_type ON traffic_snapshots(incident_type);
CREATE INDEX IF NOT EXISTS idx_traffic_snapshots_location ON traffic_snapshots USING GIST(incident_location);
