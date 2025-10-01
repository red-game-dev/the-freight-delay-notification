-- Reset Supabase migration history
-- This clears the record of what migrations have run
-- so you can run them fresh

-- Delete all migration history
DELETE FROM supabase_migrations.schema_migrations;

-- Verify it's empty
SELECT *
FROM supabase_migrations.schema_migrations;

-- Expected: 0 rows
