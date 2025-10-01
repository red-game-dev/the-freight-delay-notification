-- Check what actually exists in your remote database

-- 1. List all tables in public schema
SELECT
  table_name,
  (SELECT COUNT(*)
  FROM information_schema.columns
  WHERE columns.table_schema = tables.table_schema
    AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. List all custom types (enums)
SELECT
  typname as type_name,
  string_agg(enumlabel, ', '
ORDER BY enumsortorder
) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typnamespace =
(SELECT oid
FROM pg_namespace
WHERE nspname = 'public')
GROUP BY typname
ORDER BY typname;

-- 3. Check if specific tables exist
SELECT
  'customers' as table_name,
  EXISTS
(SELECT 1
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'customers')
as exists
UNION ALL
SELECT 'routes', EXISTS
  (SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'routes')
UNION ALL
  SELECT 'deliveries', EXISTS
  (SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'deliveries')
UNION ALL
  SELECT 'notifications', EXISTS
  (SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'notifications')
UNION ALL
  SELECT 'workflow_executions', EXISTS
  (SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'workflow_executions')
UNION ALL
  SELECT 'traffic_snapshots', EXISTS
  (SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'traffic_snapshots')
UNION ALL
  SELECT 'thresholds', EXISTS
(SELECT 1
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'thresholds');
