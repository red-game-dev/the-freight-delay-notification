-- ============================================================================
-- NUCLEAR RESET - Drops EVERYTHING in public schema
-- ⚠️  WARNING: THIS DELETES ALL DATA AND SCHEMA
-- ============================================================================

-- Drop all tables (with CASCADE to handle dependencies)
DROP TABLE IF EXISTS traffic_snapshots
CASCADE;
DROP TABLE IF EXISTS workflow_executions
CASCADE;
DROP TABLE IF EXISTS notifications
CASCADE;
DROP TABLE IF EXISTS deliveries
CASCADE;
DROP TABLE IF EXISTS routes
CASCADE;
DROP TABLE IF EXISTS customers
CASCADE;
DROP TABLE IF EXISTS thresholds
CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS traffic_condition
CASCADE;
DROP TYPE IF EXISTS workflow_status
CASCADE;
DROP TYPE IF EXISTS notification_status
CASCADE;
DROP TYPE IF EXISTS notification_channel
CASCADE;
DROP TYPE IF EXISTS delivery_status
CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column
() CASCADE;
DROP FUNCTION IF EXISTS enforce_single_default_threshold
() CASCADE;

-- Verify everything is gone
SELECT
    'All tables dropped!' as status,
    (SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = 'public') as remaining_tables,
    (SELECT COUNT(*)
    FROM pg_type
    WHERE typnamespace = (SELECT oid
        FROM pg_namespace
        WHERE nspname = 'public') AND typtype = 'e') as remaining_types;

-- Expected: remaining_tables = 0, remaining_types = 0
