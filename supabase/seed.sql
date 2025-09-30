-- Insert sample customers
INSERT INTO customers (id, email, phone, name, notification_preferences)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'john.doe@example.com', '+1234567890', 'John Doe', '{"primary": "email", "secondary": "sms"}'::jsonb);

INSERT INTO customers (id, email, phone, name, notification_preferences)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'jane.smith@example.com', '+1234567891', 'Jane Smith', '{"primary": "sms", "secondary": "email"}'::jsonb);

INSERT INTO customers (id, email, phone, name, notification_preferences)
VALUES ('550e8400-e29b-41d4-a716-446655440002', 'bob.wilson@example.com', '+1234567892', 'Bob Wilson', '{"primary": "email"}'::jsonb);

-- Insert sample routes
INSERT INTO routes (id, origin_address, origin_coords, destination_address, destination_coords, distance_meters, normal_duration_seconds)
VALUES ('660e8400-e29b-41d4-a716-446655440000', '123 Main St, New York, NY', POINT(-74.006, 40.7128), '456 Oak Ave, Brooklyn, NY', POINT(-73.9442, 40.6782), 15000, 1800);

INSERT INTO routes (id, origin_address, origin_coords, destination_address, destination_coords, distance_meters, normal_duration_seconds)
VALUES ('660e8400-e29b-41d4-a716-446655440001', '789 Pine St, Los Angeles, CA', POINT(-118.2437, 34.0522), '321 Elm St, Santa Monica, CA', POINT(-118.4912, 34.0195), 25000, 2400);

-- Insert sample deliveries
INSERT INTO deliveries (id, tracking_number, customer_id, route_id, status, scheduled_delivery, delay_threshold_minutes)
VALUES ('770e8400-e29b-41d4-a716-446655440000', 'FD-2024-001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'in_transit'::delivery_status, NOW() + INTERVAL '2 hours', 30);

INSERT INTO deliveries (id, tracking_number, customer_id, route_id, status, scheduled_delivery, delay_threshold_minutes)
VALUES ('770e8400-e29b-41d4-a716-446655440001', 'FD-2024-002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'pending'::delivery_status, NOW() + INTERVAL '4 hours', 45);