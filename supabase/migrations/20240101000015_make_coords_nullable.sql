-- Make route coordinates nullable
-- Some routes may not have coordinates yet (need to be geocoded)

ALTER TABLE routes
  ALTER COLUMN origin_coords DROP NOT NULL,
  ALTER COLUMN destination_coords DROP NOT NULL;

-- Add comment explaining this
COMMENT ON COLUMN routes.origin_coords IS 'Origin coordinates (PostGIS POINT). Null if not yet geocoded.';
COMMENT ON COLUMN routes.destination_coords IS 'Destination coordinates (PostGIS POINT). Null if not yet geocoded.';
