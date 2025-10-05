-- Migration: Transaction Safety - Atomic Increment
-- Prevents race conditions on checks_performed counter
-- Date: 2025-01-05

-- ============================================================================
-- ATOMIC INCREMENT FUNCTION (Prevent Race Conditions)
-- ============================================================================

-- Atomic increment of checks_performed
-- Returns the NEW count after increment
-- Used in workflows/activities.ts to prevent race conditions
CREATE OR REPLACE FUNCTION increment_checks_performed(delivery_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE deliveries
  SET
    checks_performed = checks_performed + 1,
    updated_at = NOW() -- Update timestamp for accurate next check calculation
  WHERE id = delivery_uuid
  RETURNING checks_performed INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USAGE EXAMPLE
-- ============================================================================

-- Example: Atomic increment of checks
-- SELECT increment_checks_performed('delivery-uuid');

-- ============================================================================
-- APPLICATION INTEGRATION
-- ============================================================================

-- In your application code (TypeScript):
-- const newCount = await db.query(
--   'SELECT increment_checks_performed($1)',
--   [deliveryId]
-- );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION increment_checks_performed IS 'Atomically increment checks_performed counter (prevents race conditions)';
