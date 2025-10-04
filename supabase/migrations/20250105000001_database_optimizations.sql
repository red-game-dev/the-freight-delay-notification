-- Database Optimization Migration
-- Adds indexes, foreign key constraints, and data integrity checks
-- Based on: High Performance, High Availability, and Scalability Best Practices

-- ============================================================================
-- 1. ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================================================

-- Workflow Executions - heavily queried table
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status
  ON workflow_executions(status) WHERE status IN ('running', 'failed');

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id
  ON workflow_executions(workflow_id);

-- Composite index for common query: workflows by delivery + status
CREATE INDEX IF NOT EXISTS idx_workflow_executions_delivery_status
  ON workflow_executions(delivery_id, status) WHERE delivery_id IS NOT NULL;

-- Index for workflow lookup by workflow_id (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_lookup
  ON workflow_executions(workflow_id, run_id);

-- Notifications - time-based queries
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at
  ON notifications(sent_at DESC) WHERE sent_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_customer_id
  ON notifications(customer_id);

-- Composite index for notification deduplication queries
CREATE INDEX IF NOT EXISTS idx_notifications_delivery_sent
  ON notifications(delivery_id, sent_at DESC) WHERE status = 'sent';

-- Traffic Snapshots - time-series data
CREATE INDEX IF NOT EXISTS idx_traffic_snapshots_route_time
  ON traffic_snapshots(route_id, snapshot_at DESC);

-- BRIN index for time-series data (better for large tables)
CREATE INDEX IF NOT EXISTS idx_traffic_snapshots_time_brin
  ON traffic_snapshots USING BRIN(snapshot_at);

-- Deliveries - common query patterns
CREATE INDEX IF NOT EXISTS idx_deliveries_customer_status
  ON deliveries(customer_id, status);

CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled_status
  ON deliveries(scheduled_delivery DESC, status)
  WHERE status IN ('pending', 'in_transit', 'delayed');

-- Index for recurring check workflows
CREATE INDEX IF NOT EXISTS idx_deliveries_recurring_checks
  ON deliveries(enable_recurring_checks, status)
  WHERE enable_recurring_checks = true AND status IN ('pending', 'in_transit', 'delayed');

-- JSONB indexes for flexible querying
CREATE INDEX IF NOT EXISTS idx_deliveries_metadata
  ON deliveries USING gin(metadata);

CREATE INDEX IF NOT EXISTS idx_traffic_snapshots_metadata
  ON traffic_snapshots USING gin(metadata);

-- ============================================================================
-- 2. UPDATE FOREIGN KEY CONSTRAINTS WITH CASCADE RULES
-- ============================================================================

-- Drop and recreate foreign keys with proper cascade rules
-- This prevents orphaned records and maintains referential integrity

-- Deliveries -> Customers (RESTRICT delete if deliveries exist)
ALTER TABLE deliveries
  DROP CONSTRAINT IF EXISTS deliveries_customer_id_fkey,
  ADD CONSTRAINT deliveries_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- Deliveries -> Routes (RESTRICT delete if deliveries exist)
ALTER TABLE deliveries
  DROP CONSTRAINT IF EXISTS deliveries_route_id_fkey,
  ADD CONSTRAINT deliveries_route_id_fkey
    FOREIGN KEY (route_id)
    REFERENCES routes(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- Notifications -> Deliveries (CASCADE delete when delivery deleted)
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_delivery_id_fkey,
  ADD CONSTRAINT notifications_delivery_id_fkey
    FOREIGN KEY (delivery_id)
    REFERENCES deliveries(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- Notifications -> Customers (RESTRICT delete if notifications exist)
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_customer_id_fkey,
  ADD CONSTRAINT notifications_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- Traffic Snapshots -> Routes (CASCADE delete when route deleted)
ALTER TABLE traffic_snapshots
  DROP CONSTRAINT IF EXISTS traffic_snapshots_route_id_fkey,
  ADD CONSTRAINT traffic_snapshots_route_id_fkey
    FOREIGN KEY (route_id)
    REFERENCES routes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- Workflow Executions -> Deliveries (SET NULL when delivery deleted)
ALTER TABLE workflow_executions
  DROP CONSTRAINT IF EXISTS workflow_executions_delivery_id_fkey,
  ADD CONSTRAINT workflow_executions_delivery_id_fkey
    FOREIGN KEY (delivery_id)
    REFERENCES deliveries(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ============================================================================
-- 3. FIX EXISTING DATA BEFORE ADDING CONSTRAINTS
-- ============================================================================

-- Fix completed workflows that are missing completion timestamp
-- Use started_at as a fallback for completed_at
UPDATE workflow_executions
SET completed_at = COALESCE(completed_at, started_at)
WHERE status IN ('completed', 'failed', 'cancelled', 'timed_out')
  AND completed_at IS NULL;

-- Fix sent notifications that are missing sent_at timestamp
-- Use created_at as a fallback for sent_at
UPDATE notifications
SET sent_at = COALESCE(sent_at, created_at)
WHERE status = 'sent'
  AND sent_at IS NULL;

-- ============================================================================
-- 4. ADD DATA INTEGRITY CONSTRAINTS
-- ============================================================================

-- Ensure completed workflows have completion time
ALTER TABLE workflow_executions
  ADD CONSTRAINT check_completed_workflow_has_time
  CHECK (
    (status != 'completed') OR
    (status = 'completed' AND completed_at IS NOT NULL)
  );

-- Ensure sent notifications have sent_at timestamp
ALTER TABLE notifications
  ADD CONSTRAINT check_sent_notification_has_time
  CHECK (
    (status != 'sent') OR
    (status = 'sent' AND sent_at IS NOT NULL)
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_workflow_executions_status IS 'Performance index for filtering workflows by status';
COMMENT ON INDEX idx_notifications_delivery_sent IS 'Supports notification deduplication queries';
COMMENT ON INDEX idx_traffic_snapshots_time_brin IS 'BRIN index for efficient time-series queries on large tables';
