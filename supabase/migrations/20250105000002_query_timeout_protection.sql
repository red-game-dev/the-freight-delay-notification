-- Migration: Query Timeout Protection (Role-Based)
-- Prevents runaway queries from blocking the database
-- Different timeouts for API users vs background workflows
-- Date: 2025-01-05

-- ============================================================================
-- WHAT THIS DOES (NOT DATA DELETION)
-- ============================================================================

-- This migration sets TIMEOUTS for queries, NOT data deletion
-- - Kills queries running too long
-- - Kills idle transactions
-- - Prevents excessive lock waits
--
-- Historical workflow records are NEVER deleted by this migration
-- They remain in the database permanently for audit trail

-- ============================================================================
-- ROLE-BASED QUERY TIMEOUTS
-- ============================================================================

-- API users (web requests): Strict timeout for fast failure
-- Fail fast on user-facing requests
ALTER ROLE authenticated SET statement_timeout = '30s';
ALTER ROLE authenticated SET lock_timeout = '10s';

-- Anonymous users: Even stricter (prevent abuse)
ALTER ROLE anon SET statement_timeout = '10s';
ALTER ROLE anon SET lock_timeout = '5s';

-- Service role (Temporal workflows): More lenient
-- Workflows may have network latency + concurrent operations
-- Need higher timeout to handle:
-- - Network latency to Supabase
-- - Lock waits from concurrent workflows
-- - Database load during peak times
ALTER ROLE service_role SET statement_timeout = '2min';
ALTER ROLE service_role SET lock_timeout = '30s';

-- ============================================================================
-- DATABASE-WIDE SETTINGS (Apply to all roles)
-- ============================================================================

-- Kill idle transactions after 5 minutes (prevents abandoned transactions)
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '5min';

-- ============================================================================
-- WHY ROLE-BASED TIMEOUTS?
-- ============================================================================

-- 1. API Requests (authenticated/anon):
--    - User-facing, need fast response
--    - Should fail quickly if DB is slow
--    - 30s is generous for simple queries
--
-- 2. Temporal Workflows (service_role):
--    - Background operations, not user-facing
--    - Can tolerate higher latency
--    - Concurrent workflows may cause lock waits
--    - Network: Temporal worker → Supabase (could be cross-region)
--    - Example: incrementChecksPerformed() locks delivery row
--              If 2 workflows run concurrently, one waits for lock
--              10s lock_timeout = query fails, 30s = usually succeeds
--
-- 3. Idle Transactions (all roles):
--    - 5min timeout catches abandoned connections
--    - Prevents holding locks indefinitely

-- ============================================================================
-- CRITICAL WORKFLOW SCENARIOS
-- ============================================================================

-- Scenario: Multiple workflows updating same delivery
--
-- Workflow A: incrementChecksPerformed(delivery-123) [holds row lock]
-- Workflow B: incrementChecksPerformed(delivery-123) [waits for lock]
--
-- With 10s lock_timeout:  B fails after 10s (too aggressive)
-- With 30s lock_timeout:  B succeeds when A completes (better)
--
-- Solution: service_role gets 30s lock timeout

-- ============================================================================
-- CONFIGURATION CHECK
-- ============================================================================

-- Verify Temporal uses service_role key:
-- SUPABASE_SERVICE_ROLE_KEY=xxx (uses service_role ✅)
--
-- If using anon key, Temporal gets 10s timeout (BAD!)
-- Make sure workflows use service_role key

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON DATABASE postgres IS 'Freight Delay Notification System - Role-based timeouts: API=30s, Workflows=2min, Idle=5min';
