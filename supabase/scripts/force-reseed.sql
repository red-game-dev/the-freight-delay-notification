-- Force complete database reset and reseed
-- This ensures migrations ran before seeding

-- Step 1: Verify migrations ran by checking if new columns exist
DO $$
BEGIN
  -- Check if recipient column exists in notifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'recipient'
  ) THEN
    RAISE EXCEPTION 'Migration 20240101000004_add_notification_fields.sql did not run! Column "recipient" missing from notifications table.';
  END IF;

  -- Check if steps column exists in workflow_executions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_executions' AND column_name = 'steps'
  ) THEN
    RAISE EXCEPTION 'Migration 20240101000006_add_workflow_steps.sql did not run! Column "steps" missing from workflow_executions table.';
  END IF;

  RAISE NOTICE 'All migrations verified successfully!';
END $$;

-- Step 2: Show current table counts
SELECT
  'BEFORE SEED:' as status,
  'customers' as table_name,
  COUNT(*) as count
FROM customers
UNION ALL
SELECT 'BEFORE SEED:', 'routes', COUNT(*) FROM routes
UNION ALL
SELECT 'BEFORE SEED:', 'deliveries', COUNT(*) FROM deliveries
UNION ALL
SELECT 'BEFORE SEED:', 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'BEFORE SEED:', 'workflow_executions', COUNT(*) FROM workflow_executions
UNION ALL
SELECT 'BEFORE SEED:', 'traffic_snapshots', COUNT(*) FROM traffic_snapshots
ORDER BY table_name;
