-- Check all table counts
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
SELECT 'traffic_snapshots', COUNT(*) FROM traffic_snapshots
UNION ALL
SELECT 'thresholds', COUNT(*) FROM thresholds
ORDER BY table_name;

-- Also show any error details if tables are empty
SELECT 'Expected: customers=20, routes=15, deliveries=50, notifications=25, workflows=20, traffic=30' as note;
