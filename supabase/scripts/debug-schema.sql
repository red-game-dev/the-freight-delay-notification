-- Debug: Check actual schema and what columns exist

-- Check notifications table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Check if recipient column exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'notifications'
  AND column_name = 'recipient'
) as recipient_exists;

-- Check workflow_executions columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workflow_executions'
ORDER BY ordinal_position;

-- Check if steps column exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'workflow_executions'
  AND column_name = 'steps'
) as steps_exists;

-- Show current data counts
SELECT
  'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'routes', COUNT(*) FROM routes
UNION ALL
SELECT 'deliveries', COUNT(*) FROM deliveries
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'workflow_executions', COUNT(*) FROM workflow_executions
UNION ALL
SELECT 'traffic_snapshots', COUNT(*) FROM traffic_snapshots;
