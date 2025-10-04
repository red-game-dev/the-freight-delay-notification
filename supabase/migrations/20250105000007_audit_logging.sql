-- Migration: Comprehensive Audit Logging
-- Tracks all data changes for compliance, security, and debugging
-- Date: 2025-01-05

-- ============================================================================
-- CREATE AUDIT SCHEMA (Separate namespace for audit data)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS audit;

COMMENT ON SCHEMA audit IS 'Audit logging schema - separate from business data for security and organization';

-- ============================================================================
-- CREATE AUDIT LOG TABLE (Partitioned by month for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit.audit_log (
  id UUID DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],  -- Array of field names that changed
  changed_by TEXT,  -- user_id, 'system', or 'temporal'
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,  -- For tracing requests across logs
  PRIMARY KEY (id, changed_at)  -- Composite key for partitioning
) PARTITION BY RANGE (changed_at);

-- Create partitions for 2025 (full year)
CREATE TABLE audit.audit_log_2025_01 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE audit.audit_log_2025_02 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE audit.audit_log_2025_03 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE audit.audit_log_2025_04 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

CREATE TABLE audit.audit_log_2025_05 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

CREATE TABLE audit.audit_log_2025_06 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

CREATE TABLE audit.audit_log_2025_07 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

CREATE TABLE audit.audit_log_2025_08 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

CREATE TABLE audit.audit_log_2025_09 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');

CREATE TABLE audit.audit_log_2025_10 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE audit.audit_log_2025_11 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE audit.audit_log_2025_12 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Create partitions for 2026 (first quarter)
CREATE TABLE audit.audit_log_2026_01 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE audit.audit_log_2026_02 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE audit.audit_log_2026_03 PARTITION OF audit.audit_log
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- ============================================================================
-- CREATE INDEXES ON PARTITIONED TABLE
-- ============================================================================

-- Index for record lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_audit_log_record
  ON audit.audit_log(table_name, record_id, changed_at DESC);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_log_time
  ON audit.audit_log(changed_at DESC);

-- Index for user actions
CREATE INDEX IF NOT EXISTS idx_audit_log_user
  ON audit.audit_log(changed_by, changed_at DESC)
  WHERE changed_by IS NOT NULL;

-- Index for action type
CREATE INDEX IF NOT EXISTS idx_audit_log_action
  ON audit.audit_log(action, changed_at DESC);

-- GIN index for searching in old_data/new_data
CREATE INDEX IF NOT EXISTS idx_audit_log_old_data
  ON audit.audit_log USING gin(old_data);

CREATE INDEX IF NOT EXISTS idx_audit_log_new_data
  ON audit.audit_log USING gin(new_data);

-- ============================================================================
-- AUTOMATIC PARTITION MANAGEMENT
-- ============================================================================

-- Function to create a partition for a specific month
CREATE OR REPLACE FUNCTION audit.create_partition_for_month(partition_date DATE)
RETURNS void AS $$
DECLARE
  partition_name TEXT;
  start_date TEXT;
  end_date TEXT;
BEGIN
  -- Generate partition name (e.g., audit_log_2025_10)
  partition_name := 'audit_log_' || to_char(partition_date, 'YYYY_MM');

  -- Generate date ranges
  start_date := to_char(date_trunc('month', partition_date), 'YYYY-MM-DD');
  end_date := to_char(date_trunc('month', partition_date) + interval '1 month', 'YYYY-MM-DD');

  -- Check if partition already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = partition_name
    AND n.nspname = 'audit'
  ) THEN
    -- Create the partition
    EXECUTE format(
      'CREATE TABLE audit.%I PARTITION OF audit.audit_log FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      start_date,
      end_date
    );

    RAISE NOTICE 'Created partition audit.% for % to %', partition_name, start_date, end_date;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure partitions exist for the next N months
CREATE OR REPLACE FUNCTION audit.ensure_partitions(months_ahead INTEGER DEFAULT 3)
RETURNS void AS $$
DECLARE
  i INTEGER;
  partition_date DATE;
BEGIN
  -- Create partitions for current month + N months ahead
  FOR i IN 0..months_ahead LOOP
    partition_date := date_trunc('month', CURRENT_DATE) + (i || ' months')::interval;
    PERFORM audit.create_partition_for_month(partition_date);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create missing partition on-demand (called before insert if needed)
CREATE OR REPLACE FUNCTION audit.create_partition_if_not_exists()
RETURNS TRIGGER AS $$
DECLARE
  partition_date DATE;
BEGIN
  -- Extract the month from the timestamp being inserted
  partition_date := date_trunc('month', NEW.changed_at);

  -- Create partition for that month if it doesn't exist
  PERFORM audit.create_partition_for_month(partition_date);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add BEFORE INSERT trigger to auto-create partitions
CREATE TRIGGER audit_log_partition_trigger
  BEFORE INSERT ON audit.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION audit.create_partition_if_not_exists();

-- Create default partition to catch any rows that don't match (safety net)
CREATE TABLE IF NOT EXISTS audit.audit_log_default PARTITION OF audit.audit_log DEFAULT;

-- Ensure we have partitions for the next 12 months
SELECT audit.ensure_partitions(12);

-- ============================================================================
-- HELPER VIEWS AND FUNCTIONS
-- ============================================================================

-- View to list all audit log partitions with metadata
CREATE OR REPLACE VIEW audit.partitions AS
SELECT
  c.relname AS partition_name,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS size,
  pg_stat_get_live_tuples(c.oid) AS row_count,
  pg_get_expr(c.relpartbound, c.oid) AS partition_bounds
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'audit'
  AND c.relname LIKE 'audit_log_%'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- Function to get partition info for a specific date
CREATE OR REPLACE FUNCTION audit.get_partition_for_date(check_date TIMESTAMPTZ DEFAULT NOW())
RETURNS TEXT AS $$
DECLARE
  partition_name TEXT;
BEGIN
  partition_name := 'audit_log_' || to_char(check_date, 'YYYY_MM');

  -- Check if partition exists
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = partition_name
    AND n.nspname = 'audit'
  ) THEN
    RETURN partition_name;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get partition statistics
CREATE OR REPLACE FUNCTION audit.partition_stats()
RETURNS TABLE (
  partition_name TEXT,
  row_count BIGINT,
  size TEXT,
  partition_range TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname::TEXT,
    pg_stat_get_live_tuples(c.oid),
    pg_size_pretty(pg_total_relation_size(c.oid)),
    pg_get_expr(c.relpartbound, c.oid)::TEXT
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'audit'
    AND c.relname LIKE 'audit_log_%'
    AND c.relkind = 'r'
  ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUDIT TRIGGER FUNCTION (Generic)
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  old_json JSONB;
  new_json JSONB;
  changed_fields TEXT[];
  changed_by_user TEXT;
BEGIN
  -- Get current user (from app context or auth)
  changed_by_user := COALESCE(
    current_setting('app.current_user', true),
    'system'
  );

  -- Convert row to JSON
  IF TG_OP = 'DELETE' THEN
    old_json := row_to_json(OLD)::JSONB;
    new_json := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    old_json := row_to_json(OLD)::JSONB;
    new_json := row_to_json(NEW)::JSONB;

    -- Calculate changed fields
    SELECT array_agg(key)
    INTO changed_fields
    FROM jsonb_each(old_json) old_val
    WHERE new_json->>old_val.key IS DISTINCT FROM old_val.value::TEXT;
  ELSE  -- INSERT
    old_json := NULL;
    new_json := row_to_json(NEW)::JSONB;
  END IF;

  -- Insert audit record
  INSERT INTO audit.audit_log (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields,
    changed_by,
    user_agent,
    request_id
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN (old_json->>'id')::UUID ELSE (new_json->>'id')::UUID END
    ),
    TG_OP,
    old_json,
    new_json,
    changed_fields,
    changed_by_user,
    current_setting('app.user_agent', true),
    current_setting('app.request_id', true)
  );

  -- Return appropriate value
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- APPLY AUDIT TRIGGERS TO CRITICAL TABLES
-- ============================================================================

-- Deliveries (high value - track all changes)
DROP TRIGGER IF EXISTS audit_deliveries ON deliveries;
CREATE TRIGGER audit_deliveries
  AFTER INSERT OR UPDATE OR DELETE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Customers (PII - required for compliance)
DROP TRIGGER IF EXISTS audit_customers ON customers;
CREATE TRIGGER audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Notifications (track all notification attempts)
DROP TRIGGER IF EXISTS audit_notifications ON notifications;
CREATE TRIGGER audit_notifications
  AFTER INSERT OR UPDATE OR DELETE ON notifications
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Workflow Executions (operational tracking)
DROP TRIGGER IF EXISTS audit_workflow_executions ON workflow_executions;
CREATE TRIGGER audit_workflow_executions
  AFTER INSERT OR UPDATE OR DELETE ON workflow_executions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Thresholds (configuration changes)
DROP TRIGGER IF EXISTS audit_thresholds ON thresholds;
CREATE TRIGGER audit_thresholds
  AFTER INSERT OR UPDATE OR DELETE ON thresholds
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Routes (track route changes)
DROP TRIGGER IF EXISTS audit_routes ON routes;
CREATE TRIGGER audit_routes
  AFTER INSERT OR UPDATE OR DELETE ON routes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================================
-- AUDIT CONTEXT FUNCTIONS (Used in API middleware)
-- ============================================================================

-- Set user ID for current transaction
CREATE OR REPLACE FUNCTION set_audit_user(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user', user_id, false);
END;
$$ LANGUAGE plpgsql;

-- Set user agent for current transaction
CREATE OR REPLACE FUNCTION set_audit_user_agent(agent TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.user_agent', agent, false);
END;
$$ LANGUAGE plpgsql;

-- Set request ID for current transaction
CREATE OR REPLACE FUNCTION set_audit_request_id(req_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.request_id', req_id, false);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEMA PERMISSIONS
-- ============================================================================

-- Grant usage on audit schema to service role
GRANT USAGE ON SCHEMA audit TO service_role;
GRANT USAGE ON SCHEMA audit TO authenticated;

-- Grant INSERT on audit_log to allow triggers to write
GRANT INSERT ON audit.audit_log TO service_role;
GRANT INSERT ON audit.audit_log TO authenticated;

-- Grant SELECT for querying audit logs (optional - remove if too permissive)
GRANT SELECT ON audit.audit_log TO service_role;

-- Grant access to helper views and functions
GRANT SELECT ON audit.partitions TO service_role;
GRANT EXECUTE ON FUNCTION audit.get_partition_for_date TO service_role;
GRANT EXECUTE ON FUNCTION audit.partition_stats TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON SCHEMA audit IS 'Audit logging schema - separate from business data for security and organization';
COMMENT ON TABLE audit.audit_log IS 'Audit trail for all data changes - partitioned by month with automatic partition creation';
COMMENT ON VIEW audit.partitions IS 'View showing all audit log partitions with size and row count';

-- Partition management function comments
COMMENT ON FUNCTION audit.create_partition_for_month IS 'Creates a partition for a specific month if it does not exist';
COMMENT ON FUNCTION audit.ensure_partitions IS 'Ensures partitions exist for the next N months (default 3)';
COMMENT ON FUNCTION audit.create_partition_if_not_exists IS 'Trigger function that auto-creates partitions on demand';

-- Helper function comments
COMMENT ON FUNCTION audit.get_partition_for_date IS 'Returns partition name for a given date, or NULL if partition does not exist';
COMMENT ON FUNCTION audit.partition_stats IS 'Returns statistics for all audit log partitions (row count, size, range)';

-- Audit trigger and context function comments
COMMENT ON FUNCTION audit_trigger_func IS 'Generic trigger function that logs all INSERT/UPDATE/DELETE operations';
COMMENT ON FUNCTION set_audit_user IS 'Set user context for audit logging (called from API middleware)';
COMMENT ON FUNCTION set_audit_user_agent IS 'Set user agent for audit logging (called from API middleware)';
COMMENT ON FUNCTION set_audit_request_id IS 'Set request ID for audit logging (called from API middleware)';

-- ============================================================================
-- USAGE NOTES
-- ============================================================================

-- Call from API middleware before database operations:
-- SELECT set_audit_user('user@example.com');
-- SELECT set_audit_user_agent('Mozilla/5.0...');
-- SELECT set_audit_request_id('req-123');

-- Query audit logs:
-- SELECT * FROM audit.audit_log WHERE table_name = 'deliveries' ORDER BY changed_at DESC;

-- ============================================================================
-- PARTITION MANAGEMENT QUERIES
-- ============================================================================

-- List all partitions (simple):
SELECT * FROM audit.partitions;

-- Get detailed partition statistics:
SELECT * FROM audit.partition_stats();

-- Check which partition handles a specific date:
SELECT audit.get_partition_for_date('2025-10-15'::TIMESTAMPTZ);
SELECT audit.get_partition_for_date(NOW());

-- Manually create partitions for next 6 months:
SELECT audit.ensure_partitions(6);

-- Note: Partitions are created AUTOMATICALLY on INSERT
-- You rarely need to manually create them!

-- ============================================================================
-- HOW AUTOMATIC PARTITIONING WORKS
-- ============================================================================

-- 1. BEFORE INSERT trigger fires on audit.audit_log
-- 2. Trigger extracts month from changed_at timestamp
-- 3. Checks if partition exists for that month
-- 4. Creates partition if missing
-- 5. Insert proceeds into correct partition
--
-- SAFETY NET: Default partition catches any rows that don't match
-- (should never happen, but prevents data loss)
--
-- PERFORMANCE: Trigger only runs on INSERT, minimal overhead
-- CHECK is cached, so existing partitions are fast
