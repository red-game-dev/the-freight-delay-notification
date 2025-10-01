-- Test individual inserts to find which table is failing

-- Test 1: Insert one customer
INSERT INTO customers (id, email, phone, name, notification_preferences)
VALUES ('test-0000-0000-0000-000000000001', 'test@example.com', '+1234567890', 'Test User', '{"primary": "email"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

SELECT 'Test 1: Customer insert' as test, COUNT(*) as count FROM customers WHERE id = 'test-0000-0000-0000-000000000001';

-- Test 2: Insert one route
INSERT INTO routes (id, origin_address, origin_coords, destination_address, destination_coords, distance_meters, normal_duration_seconds)
VALUES ('test-0000-0000-0000-000000000002', 'Test Origin', POINT(-118.2437, 34.0522), 'Test Destination', POINT(-118.4085, 33.9416), 10000, 1800)
ON CONFLICT (id) DO NOTHING;

SELECT 'Test 2: Route insert' as test, COUNT(*) as count FROM routes WHERE id = 'test-0000-0000-0000-000000000002';

-- Test 3: Insert one delivery
INSERT INTO deliveries (id, tracking_number, customer_id, route_id, status, scheduled_delivery, delay_threshold_minutes)
VALUES ('test-0000-0000-0000-000000000003', 'TEST-001', 'test-0000-0000-0000-000000000001', 'test-0000-0000-0000-000000000002', 'pending'::delivery_status, NOW() + INTERVAL '1 hour', 30)
ON CONFLICT (id) DO NOTHING;

SELECT 'Test 3: Delivery insert' as test, COUNT(*) as count FROM deliveries WHERE id = 'test-0000-0000-0000-000000000003';

-- Test 4: Insert one notification
INSERT INTO notifications (id, delivery_id, customer_id, channel, status, recipient, message, sent_at)
VALUES ('test-0000-0000-0000-000000000004', 'test-0000-0000-0000-000000000003', 'test-0000-0000-0000-000000000001', 'email'::notification_channel, 'sent'::notification_status, 'test@example.com', 'Test notification', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT 'Test 4: Notification insert' as test, COUNT(*) as count FROM notifications WHERE id = 'test-0000-0000-0000-000000000004';

-- Test 5: Insert one workflow
INSERT INTO workflow_executions (id, workflow_id, run_id, delivery_id, status, started_at)
VALUES ('test-0000-0000-0000-000000000005', 'test-workflow-001', 'test-run-001', 'test-0000-0000-0000-000000000003', 'completed'::workflow_status, NOW())
ON CONFLICT (id) DO NOTHING;

SELECT 'Test 5: Workflow insert' as test, COUNT(*) as count FROM workflow_executions WHERE id = 'test-0000-0000-0000-000000000005';

-- Test 6: Insert one traffic snapshot
INSERT INTO traffic_snapshots (id, route_id, traffic_condition, delay_minutes, duration_seconds, snapshot_at)
VALUES ('test-0000-0000-0000-000000000006', 'test-0000-0000-0000-000000000002', 'moderate'::traffic_condition, 15, 2000, NOW())
ON CONFLICT (id) DO NOTHING;

SELECT 'Test 6: Traffic snapshot insert' as test, COUNT(*) as count FROM traffic_snapshots WHERE id = 'test-0000-0000-0000-000000000006';

-- Clean up test data
DELETE FROM traffic_snapshots WHERE id = 'test-0000-0000-0000-000000000006';
DELETE FROM workflow_executions WHERE id = 'test-0000-0000-0000-000000000005';
DELETE FROM notifications WHERE id = 'test-0000-0000-0000-000000000004';
DELETE FROM deliveries WHERE id = 'test-0000-0000-0000-000000000003';
DELETE FROM routes WHERE id = 'test-0000-0000-0000-000000000002';
DELETE FROM customers WHERE id = 'test-0000-0000-0000-000000000001';

SELECT 'All tests completed' as status;
