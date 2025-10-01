-- ============================================================================
-- CLEAR ALL DATA - Deletes all rows but keeps schema
-- ⚠️  WARNING: THIS DELETES ALL DATA (but keeps tables)
-- ============================================================================

-- Delete in correct order (respecting foreign key constraints)
DELETE FROM traffic_snapshots;
DELETE FROM workflow_executions;
DELETE FROM notifications;
DELETE FROM deliveries;
DELETE FROM routes;
DELETE FROM customers;
DELETE FROM thresholds;

-- Verify everything is cleared
SELECT
    'All data cleared!' as status,
    (SELECT COUNT(*) FROM customers) as customers_count,
    (SELECT COUNT(*) FROM routes) as routes_count,
    (SELECT COUNT(*) FROM deliveries) as deliveries_count,
    (SELECT COUNT(*) FROM notifications) as notifications_count,
    (SELECT COUNT(*) FROM workflow_executions) as workflows_count,
    (SELECT COUNT(*) FROM traffic_snapshots) as traffic_count,
    (SELECT COUNT(*) FROM thresholds) as thresholds_count;

-- Expected: All counts = 0
