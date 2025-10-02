-- Insert sample customers (20 total for pagination testing)
INSERT INTO customers (id, email, phone, name, notification_preferences)
VALUES
  -- Your actual test customer
  ('550e8400-e29b-41d4-a716-446655440000', 'red.pace.dev@gmail.com', '+35679323059', 'Red Pace Dev', '{"primary": "email", "secondary": "sms"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440001', 'jane.smith@example.com', '+1234567891', 'Jane Smith', '{"primary": "sms", "secondary": "email"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440002', 'bob.johnson@example.com', '+1234567892', 'Bob Johnson', '{"primary": "email"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440003', 'alice.williams@example.com', '+1234567893', 'Alice Williams', '{"primary": "email", "secondary": "sms"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440004', 'charlie.brown@example.com', '+1234567894', 'Charlie Brown', '{"primary": "sms"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440005', 'david.miller@example.com', '+1234567895', 'David Miller', '{"primary": "email"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440006', 'emily.davis@example.com', '+1234567896', 'Emily Davis', '{"primary": "sms", "secondary": "email"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440007', 'frank.wilson@example.com', '+1234567897', 'Frank Wilson', '{"primary": "email", "secondary": "sms"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440008', 'grace.moore@example.com', '+1234567898', 'Grace Moore', '{"primary": "email"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440009', 'henry.taylor@example.com', '+1234567899', 'Henry Taylor', '{"primary": "sms"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440010', 'isabel.anderson@example.com', '+1234567800', 'Isabel Anderson', '{"primary": "email", "secondary": "sms"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440011', 'jack.thomas@example.com', '+1234567801', 'Jack Thomas', '{"primary": "sms", "secondary": "email"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440012', 'karen.jackson@example.com', '+1234567802', 'Karen Jackson', '{"primary": "email"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440013', 'leo.white@example.com', '+1234567803', 'Leo White', '{"primary": "sms"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440014', 'maria.harris@example.com', '+1234567804', 'Maria Harris', '{"primary": "email", "secondary": "sms"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440015', 'nathan.martin@example.com', '+1234567805', 'Nathan Martin', '{"primary": "email"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440016', 'olivia.thompson@example.com', '+1234567806', 'Olivia Thompson', '{"primary": "sms", "secondary": "email"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440017', 'paul.garcia@example.com', '+1234567807', 'Paul Garcia', '{"primary": "email"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440018', 'quinn.martinez@example.com', '+1234567808', 'Quinn Martinez', '{"primary": "sms"}'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440019', 'rachel.robinson@example.com', '+1234567809', 'Rachel Robinson', '{"primary": "email", "secondary": "sms"}'::jsonb);

-- Insert sample routes (45 total covering major cities worldwide)
-- NOTE: Routes include POINT coordinates for map display
-- These coordinates are NOT fetched from Google Maps API
-- Google Maps API only provides TRAFFIC CONDITIONS (delay, duration, etc)
-- The cron job will update traffic_condition and current_duration_seconds fields
INSERT INTO routes (id, origin_address, origin_coords, destination_address, destination_coords, distance_meters, normal_duration_seconds)
VALUES
  -- North America (15 routes)
  ('660e8400-e29b-41d4-a716-446655440000', 'Downtown Los Angeles, CA', POINT(-118.2437, 34.0522), 'LAX Airport, CA', POINT(-118.4085, 33.9416), 22000, 1800),
  ('660e8400-e29b-41d4-a716-446655440001', 'Times Square, Manhattan, NY', POINT(-73.9855, 40.7580), 'JFK Airport, Queens, NY', POINT(-73.7781, 40.6413), 28000, 2700),
  ('660e8400-e29b-41d4-a716-446655440002', 'Downtown San Francisco, CA', POINT(-122.4194, 37.7749), 'San Jose, CA', POINT(-121.8863, 37.3382), 75000, 4500),
  ('660e8400-e29b-41d4-a716-446655440003', 'Chicago Loop, IL', POINT(-87.6298, 41.8781), 'O''Hare Airport, IL', POINT(-87.9073, 41.9742), 27000, 2100),
  ('660e8400-e29b-41d4-a716-446655440004', 'Seattle Downtown, WA', POINT(-122.3321, 47.6062), 'Portland, OR', POINT(-122.6784, 45.5152), 280000, 10800),
  ('660e8400-e29b-41d4-a716-446655440005', 'Boston Common, MA', POINT(-71.0589, 42.3601), 'Logan Airport, MA', POINT(-71.0096, 42.3656), 8000, 900),
  ('660e8400-e29b-41d4-a716-446655440006', 'Downtown Miami, FL', POINT(-80.1918, 25.7617), 'Fort Lauderdale, FL', POINT(-80.1373, 26.1224), 45000, 2700),
  ('660e8400-e29b-41d4-a716-446655440007', 'Downtown Denver, CO', POINT(-104.9903, 39.7392), 'Boulder, CO', POINT(-105.2705, 40.0150), 45000, 2400),
  ('660e8400-e29b-41d4-a716-446655440008', 'Downtown Austin, TX', POINT(-97.7431, 30.2672), 'San Antonio, TX', POINT(-98.4936, 29.4241), 130000, 5400),
  ('660e8400-e29b-41d4-a716-446655440009', 'Downtown Phoenix, AZ', POINT(-112.0740, 33.4484), 'Scottsdale, AZ', POINT(-111.9261, 33.4942), 25000, 1800),
  ('660e8400-e29b-41d4-a716-446655440010', 'Downtown Atlanta, GA', POINT(-84.3880, 33.7490), 'Hartsfield Airport, GA', POINT(-84.4277, 33.6407), 18000, 1500),
  ('660e8400-e29b-41d4-a716-446655440011', 'Downtown Philadelphia, PA', POINT(-75.1652, 39.9526), 'King of Prussia, PA', POINT(-75.3860, 40.0893), 30000, 2100),
  ('660e8400-e29b-41d4-a716-446655440012', 'Downtown Las Vegas, NV', POINT(-115.1398, 36.1699), 'Henderson, NV', POINT(-114.9817, 36.0395), 25000, 1800),
  ('660e8400-e29b-41d4-a716-446655440013', 'Downtown San Diego, CA', POINT(-117.1611, 32.7157), 'La Jolla, CA', POINT(-117.2713, 32.8328), 20000, 1500),
  ('660e8400-e29b-41d4-a716-446655440014', 'Downtown Houston, TX', POINT(-95.3698, 29.7604), 'IAH Airport, TX', POINT(-95.3414, 29.9902), 38000, 2400),

  -- Europe (10 routes)
  ('660e8400-e29b-41d4-a716-446655440015', 'London, UK', POINT(-0.1278, 51.5074), 'Manchester, UK', POINT(-2.2426, 53.4808), 320000, 14400),
  ('660e8400-e29b-41d4-a716-446655440016', 'Paris, France', POINT(2.3522, 48.8566), 'Lyon, France', POINT(4.8357, 45.7640), 470000, 16920),
  ('660e8400-e29b-41d4-a716-446655440017', 'Berlin, Germany', POINT(13.4050, 52.5200), 'Munich, Germany', POINT(11.5820, 48.1351), 585000, 21060),
  ('660e8400-e29b-41d4-a716-446655440018', 'Madrid, Spain', POINT(-3.7038, 40.4168), 'Barcelona, Spain', POINT(2.1734, 41.3851), 625000, 22500),
  ('660e8400-e29b-41d4-a716-446655440019', 'Rome, Italy', POINT(12.4964, 41.9028), 'Milan, Italy', POINT(9.1900, 45.4642), 575000, 20700),
  ('660e8400-e29b-41d4-a716-446655440020', 'Amsterdam, Netherlands', POINT(4.9041, 52.3676), 'Rotterdam, Netherlands', POINT(4.47917, 51.9225), 80000, 3600),
  ('660e8400-e29b-41d4-a716-446655440021', 'Brussels, Belgium', POINT(4.3517, 50.8503), 'Antwerp, Belgium', POINT(4.4025, 51.2194), 50000, 2700),
  ('660e8400-e29b-41d4-a716-446655440022', 'Vienna, Austria', POINT(16.3738, 48.2082), 'Salzburg, Austria', POINT(13.0550, 47.8095), 300000, 10800),
  ('660e8400-e29b-41d4-a716-446655440023', 'Lisbon, Portugal', POINT(-9.1393, 38.7223), 'Porto, Portugal', POINT(-8.6291, 41.1579), 315000, 11340),
  ('660e8400-e29b-41d4-a716-446655440024', 'Stockholm, Sweden', POINT(18.0686, 59.3293), 'Gothenburg, Sweden', POINT(11.9746, 57.7089), 470000, 16920),

  -- Asia (10 routes)
  ('660e8400-e29b-41d4-a716-446655440025', 'Tokyo, Japan', POINT(139.6503, 35.6762), 'Osaka, Japan', POINT(135.5023, 34.6937), 515000, 18540),
  ('660e8400-e29b-41d4-a716-446655440026', 'Beijing, China', POINT(116.4074, 39.9042), 'Shanghai, China', POINT(121.4737, 31.2304), 1200000, 43200),
  ('660e8400-e29b-41d4-a716-446655440027', 'Seoul, South Korea', POINT(126.9780, 37.5665), 'Busan, South Korea', POINT(129.0756, 35.1796), 325000, 11700),
  ('660e8400-e29b-41d4-a716-446655440028', 'Mumbai, India', POINT(72.8777, 19.0760), 'Pune, India', POINT(73.8567, 18.5204), 150000, 5400),
  ('660e8400-e29b-41d4-a716-446655440029', 'Delhi, India', POINT(77.1025, 28.7041), 'Jaipur, India', POINT(75.7873, 26.9124), 280000, 10080),
  ('660e8400-e29b-41d4-a716-446655440030', 'Singapore', POINT(103.8198, 1.3521), 'Johor Bahru, Malaysia', POINT(103.7414, 1.4927), 35000, 1800),
  ('660e8400-e29b-41d4-a716-446655440031', 'Bangkok, Thailand', POINT(100.5018, 13.7563), 'Chiang Mai, Thailand', POINT(98.9853, 18.7883), 700000, 25200),
  ('660e8400-e29b-41d4-a716-446655440032', 'Hong Kong', POINT(114.1694, 22.3193), 'Shenzhen, China', POINT(114.0579, 22.5431), 35000, 1800),
  ('660e8400-e29b-41d4-a716-446655440033', 'Kuala Lumpur, Malaysia', POINT(101.6869, 3.1390), 'Penang, Malaysia', POINT(100.3327, 5.4164), 350000, 12600),
  ('660e8400-e29b-41d4-a716-446655440034', 'Jakarta, Indonesia', POINT(106.8456, -6.2088), 'Bandung, Indonesia', POINT(107.6191, -6.9175), 150000, 5400),

  -- South America (5 routes)
  ('660e8400-e29b-41d4-a716-446655440035', 'São Paulo, Brazil', POINT(-46.6333, -23.5505), 'Rio de Janeiro, Brazil', POINT(-43.1729, -22.9068), 430000, 15480),
  ('660e8400-e29b-41d4-a716-446655440036', 'Buenos Aires, Argentina', POINT(-58.3816, -34.6037), 'Córdoba, Argentina', POINT(-64.1888, -31.4201), 700000, 25200),
  ('660e8400-e29b-41d4-a716-446655440037', 'Lima, Peru', POINT(-77.0428, -12.0464), 'Arequipa, Peru', POINT(-71.5375, -16.4090), 1000000, 36000),
  ('660e8400-e29b-41d4-a716-446655440038', 'Bogotá, Colombia', POINT(-74.0721, 4.7110), 'Medellín, Colombia', POINT(-75.5812, 6.2442), 415000, 14940),
  ('660e8400-e29b-41d4-a716-446655440039', 'Santiago, Chile', POINT(-70.6693, -33.4489), 'Valparaíso, Chile', POINT(-71.6188, -33.0472), 120000, 4320),

  -- Australia & Oceania (3 routes)
  ('660e8400-e29b-41d4-a716-446655440040', 'Sydney, Australia', POINT(151.2093, -33.8688), 'Melbourne, Australia', POINT(144.9631, -37.8136), 880000, 31680),
  ('660e8400-e29b-41d4-a716-446655440041', 'Brisbane, Australia', POINT(153.0251, -27.4698), 'Gold Coast, Australia', POINT(153.4000, -28.0167), 80000, 3600),
  ('660e8400-e29b-41d4-a716-446655440042', 'Auckland, New Zealand', POINT(174.7633, -36.8485), 'Wellington, New Zealand', POINT(174.7762, -41.2865), 640000, 23040);

-- Insert sample deliveries with diverse statuses (50 total for pagination testing)
INSERT INTO deliveries (id, tracking_number, customer_id, route_id, status, scheduled_delivery, actual_delivery, delay_threshold_minutes)
VALUES
  -- In Transit deliveries (15 total)
  ('770e8400-e29b-41d4-a716-446655440000', 'FD-2024-001', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'in_transit'::delivery_status, NOW() + INTERVAL '2 hours', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440004', 'FD-2024-005', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'in_transit'::delivery_status, NOW() + INTERVAL '3 hours', NULL, 60),
  ('770e8400-e29b-41d4-a716-446655440006', 'FD-2024-007', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'in_transit'::delivery_status, NOW() + INTERVAL '5 hours', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440011', 'FD-2024-012', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 'in_transit'::delivery_status, NOW() + INTERVAL '4 hours', NULL, 45),
  ('770e8400-e29b-41d4-a716-446655440015', 'FD-2024-016', '550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', 'in_transit'::delivery_status, NOW() + INTERVAL '1 hour', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440018', 'FD-2024-019', '550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', 'in_transit'::delivery_status, NOW() + INTERVAL '2.5 hours', NULL, 40),
  ('770e8400-e29b-41d4-a716-446655440021', 'FD-2024-022', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', 'in_transit'::delivery_status, NOW() + INTERVAL '6 hours', NULL, 50),
  ('770e8400-e29b-41d4-a716-446655440024', 'FD-2024-025', '550e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440009', 'in_transit'::delivery_status, NOW() + INTERVAL '3.5 hours', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440027', 'FD-2024-028', '550e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440010', 'in_transit'::delivery_status, NOW() + INTERVAL '1.5 hours', NULL, 35),
  ('770e8400-e29b-41d4-a716-446655440030', 'FD-2024-031', '550e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440011', 'in_transit'::delivery_status, NOW() + INTERVAL '4.5 hours', NULL, 45),
  ('770e8400-e29b-41d4-a716-446655440033', 'FD-2024-034', '550e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440012', 'in_transit'::delivery_status, NOW() + INTERVAL '2 hours', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440036', 'FD-2024-037', '550e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440013', 'in_transit'::delivery_status, NOW() + INTERVAL '3 hours', NULL, 40),
  ('770e8400-e29b-41d4-a716-446655440039', 'FD-2024-040', '550e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440014', 'in_transit'::delivery_status, NOW() + INTERVAL '5 hours', NULL, 50),
  ('770e8400-e29b-41d4-a716-446655440042', 'FD-2024-043', '550e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440000', 'in_transit'::delivery_status, NOW() + INTERVAL '1 hour', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440045', 'FD-2024-046', '550e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440001', 'in_transit'::delivery_status, NOW() + INTERVAL '2.5 hours', NULL, 35),

  -- Delayed deliveries (10 total)
  ('770e8400-e29b-41d4-a716-446655440001', 'FD-2024-002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'delayed'::delivery_status, NOW() + INTERVAL '1 hour', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440009', 'FD-2024-010', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 'delayed'::delivery_status, NOW() + INTERVAL '30 minutes', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440013', 'FD-2024-014', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 'delayed'::delivery_status, NOW() + INTERVAL '45 minutes', NULL, 25),
  ('770e8400-e29b-41d4-a716-446655440017', 'FD-2024-018', '550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', 'delayed'::delivery_status, NOW() + INTERVAL '20 minutes', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440020', 'FD-2024-021', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', 'delayed'::delivery_status, NOW() + INTERVAL '1.5 hours', NULL, 40),
  ('770e8400-e29b-41d4-a716-446655440023', 'FD-2024-024', '550e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440009', 'delayed'::delivery_status, NOW() + INTERVAL '50 minutes', NULL, 35),
  ('770e8400-e29b-41d4-a716-446655440026', 'FD-2024-027', '550e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440010', 'delayed'::delivery_status, NOW() + INTERVAL '40 minutes', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440029', 'FD-2024-030', '550e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440011', 'delayed'::delivery_status, NOW() + INTERVAL '1 hour', NULL, 45),
  ('770e8400-e29b-41d4-a716-446655440032', 'FD-2024-033', '550e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440012', 'delayed'::delivery_status, NOW() + INTERVAL '25 minutes', NULL, 20),
  ('770e8400-e29b-41d4-a716-446655440035', 'FD-2024-036', '550e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440013', 'delayed'::delivery_status, NOW() + INTERVAL '35 minutes', NULL, 30),

  -- Delivered deliveries (15 total)
  ('770e8400-e29b-41d4-a716-446655440002', 'FD-2024-003', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'delivered'::delivery_status, NOW() - INTERVAL '24 hours', NOW() - INTERVAL '23 hours', 45),
  ('770e8400-e29b-41d4-a716-446655440005', 'FD-2024-006', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'delivered'::delivery_status, NOW() - INTERVAL '48 hours', NOW() - INTERVAL '47 hours', 30),
  ('770e8400-e29b-41d4-a716-446655440008', 'FD-2024-009', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'delivered'::delivery_status, NOW() - INTERVAL '72 hours', NOW() - INTERVAL '71 hours', 30),
  ('770e8400-e29b-41d4-a716-446655440012', 'FD-2024-013', '550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', 'delivered'::delivery_status, NOW() - INTERVAL '36 hours', NOW() - INTERVAL '35 hours', 40),
  ('770e8400-e29b-41d4-a716-446655440016', 'FD-2024-017', '550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', 'delivered'::delivery_status, NOW() - INTERVAL '60 hours', NOW() - INTERVAL '59 hours', 35),
  ('770e8400-e29b-41d4-a716-446655440019', 'FD-2024-020', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', 'delivered'::delivery_status, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours', 30),
  ('770e8400-e29b-41d4-a716-446655440022', 'FD-2024-023', '550e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440009', 'delivered'::delivery_status, NOW() - INTERVAL '96 hours', NOW() - INTERVAL '95 hours', 45),
  ('770e8400-e29b-41d4-a716-446655440025', 'FD-2024-026', '550e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440010', 'delivered'::delivery_status, NOW() - INTERVAL '84 hours', NOW() - INTERVAL '83 hours', 40),
  ('770e8400-e29b-41d4-a716-446655440028', 'FD-2024-029', '550e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440011', 'delivered'::delivery_status, NOW() - INTERVAL '120 hours', NOW() - INTERVAL '119 hours', 50),
  ('770e8400-e29b-41d4-a716-446655440031', 'FD-2024-032', '550e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440012', 'delivered'::delivery_status, NOW() - INTERVAL '18 hours', NOW() - INTERVAL '17 hours', 30),
  ('770e8400-e29b-41d4-a716-446655440034', 'FD-2024-035', '550e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440013', 'delivered'::delivery_status, NOW() - INTERVAL '30 hours', NOW() - INTERVAL '29 hours', 35),
  ('770e8400-e29b-41d4-a716-446655440037', 'FD-2024-038', '550e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440014', 'delivered'::delivery_status, NOW() - INTERVAL '54 hours', NOW() - INTERVAL '53 hours', 40),
  ('770e8400-e29b-41d4-a716-446655440040', 'FD-2024-041', '550e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440000', 'delivered'::delivery_status, NOW() - INTERVAL '66 hours', NOW() - INTERVAL '65 hours', 45),
  ('770e8400-e29b-41d4-a716-446655440043', 'FD-2024-044', '550e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440001', 'delivered'::delivery_status, NOW() - INTERVAL '108 hours', NOW() - INTERVAL '107 hours', 30),
  ('770e8400-e29b-41d4-a716-446655440046', 'FD-2024-047', '550e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440002', 'delivered'::delivery_status, NOW() - INTERVAL '144 hours', NOW() - INTERVAL '143 hours', 50),

  -- Pending deliveries (7 total)
  ('770e8400-e29b-41d4-a716-446655440003', 'FD-2024-004', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'pending'::delivery_status, NOW() + INTERVAL '6 hours', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440007', 'FD-2024-008', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'pending'::delivery_status, NOW() + INTERVAL '12 hours', NULL, 45),
  ('770e8400-e29b-41d4-a716-446655440010', 'FD-2024-011', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 'pending'::delivery_status, NOW() + INTERVAL '8 hours', NULL, 35),
  ('770e8400-e29b-41d4-a716-446655440014', 'FD-2024-015', '550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', 'pending'::delivery_status, NOW() + INTERVAL '24 hours', NULL, 50),
  ('770e8400-e29b-41d4-a716-446655440038', 'FD-2024-039', '550e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440014', 'pending'::delivery_status, NOW() + INTERVAL '18 hours', NULL, 40),
  ('770e8400-e29b-41d4-a716-446655440041', 'FD-2024-042', '550e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440000', 'pending'::delivery_status, NOW() + INTERVAL '10 hours', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440044', 'FD-2024-045', '550e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440001', 'pending'::delivery_status, NOW() + INTERVAL '15 hours', NULL, 35),

  -- Cancelled deliveries (3 total)
  ('770e8400-e29b-41d4-a716-446655440047', 'FD-2024-048', '550e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440002', 'cancelled'::delivery_status, NOW() + INTERVAL '4 hours', NULL, 30),
  ('770e8400-e29b-41d4-a716-446655440048', 'FD-2024-049', '550e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440003', 'cancelled'::delivery_status, NOW() + INTERVAL '7 hours', NULL, 40),
  ('770e8400-e29b-41d4-a716-446655440049', 'FD-2024-050', '550e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440004', 'cancelled'::delivery_status, NOW() + INTERVAL '9 hours', NULL, 45);

-- Insert sample notifications (25 total - emails, SMS, and different statuses)
-- NOTE: If this fails with "column recipient does not exist", run migrations first:
-- npx supabase migration repair --status applied
INSERT INTO notifications (id, delivery_id, customer_id, channel, status, recipient, message, delay_minutes, sent_at, external_id)
VALUES
  -- Delay notifications (sent)
  ('880e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'email'::notification_channel, 'sent'::notification_status, 'jane.smith@example.com', 'Your delivery FD-2024-002 is delayed by 25 minutes due to heavy traffic.', 25, NOW() - INTERVAL '30 minutes', 'msg-001'),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'sms'::notification_channel, 'sent'::notification_status, '+1234567894', 'Delivery FD-2024-010 delayed by 45 minutes. Updated ETA: 1 hour 15 minutes.', 45, NOW() - INTERVAL '15 minutes', 'sms-001'),
  ('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440005', 'email'::notification_channel, 'sent'::notification_status, 'david.miller@example.com', 'Traffic delay alert: FD-2024-014 is delayed by 35 minutes.', 35, NOW() - INTERVAL '25 minutes', 'msg-002'),
  ('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440007', 'sms'::notification_channel, 'sent'::notification_status, '+1234567897', 'FD-2024-018 delayed 40min due to accident on route.', 40, NOW() - INTERVAL '10 minutes', 'sms-002'),
  ('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440008', 'email'::notification_channel, 'sent'::notification_status, 'grace.moore@example.com', 'Your shipment FD-2024-021 is experiencing delays. Expected delay: 50 minutes.', 50, NOW() - INTERVAL '45 minutes', 'msg-003'),
  ('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440009', 'sms'::notification_channel, 'sent'::notification_status, '+1234567899', 'Delay notification: FD-2024-024 running 38min late.', 38, NOW() - INTERVAL '20 minutes', 'sms-003'),
  ('880e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440010', 'email'::notification_channel, 'sent'::notification_status, 'isabel.anderson@example.com', 'Traffic conditions have delayed FD-2024-027 by 32 minutes.', 32, NOW() - INTERVAL '35 minutes', 'msg-004'),
  ('880e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440011', 'email'::notification_channel, 'sent'::notification_status, 'jack.thomas@example.com', 'Delay alert for FD-2024-030: 55 minute delay expected.', 55, NOW() - INTERVAL '50 minutes', 'msg-005'),
  ('880e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440012', 'sms'::notification_channel, 'sent'::notification_status, '+1234567802', 'FD-2024-033 delayed 28min. New ETA sent via email.', 28, NOW() - INTERVAL '12 minutes', 'sms-004'),
  ('880e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440013', 'email'::notification_channel, 'sent'::notification_status, 'leo.white@example.com', 'Your delivery FD-2024-036 is delayed by 42 minutes due to traffic congestion.', 42, NOW() - INTERVAL '38 minutes', 'msg-006'),

  -- Delivery confirmation notifications
  ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'email'::notification_channel, 'sent'::notification_status, 'bob.johnson@example.com', 'Your package FD-2024-003 has been delivered successfully!', NULL, NOW() - INTERVAL '23 hours', 'msg-007'),
  ('880e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'sms'::notification_channel, 'sent'::notification_status, '+35679323059', 'Delivered: FD-2024-006 has arrived at destination.', NULL, NOW() - INTERVAL '47 hours', 'sms-005'),
  ('880e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'email'::notification_channel, 'sent'::notification_status, 'alice.williams@example.com', 'Delivery complete: FD-2024-009 was successfully delivered.', NULL, NOW() - INTERVAL '71 hours', 'msg-008'),
  ('880e8400-e29b-41d4-a716-446655440013', '770e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440006', 'email'::notification_channel, 'sent'::notification_status, 'emily.davis@example.com', 'Package FD-2024-013 delivered. Thank you for your business!', NULL, NOW() - INTERVAL '35 hours', 'msg-009'),
  ('880e8400-e29b-41d4-a716-446655440014', '770e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440008', 'sms'::notification_channel, 'sent'::notification_status, '+1234567898', 'FD-2024-020 delivered successfully!', NULL, NOW() - INTERVAL '11 hours', 'sms-006'),

  -- Pending/In-transit notifications
  ('880e8400-e29b-41d4-a716-446655440015', '770e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'email'::notification_channel, 'sent'::notification_status, 'red.pace.dev@gmail.com', 'Your delivery FD-2024-001 is now in transit. ETA: 2 hours.', NULL, NOW() - INTERVAL '1 hour', 'msg-010'),
  ('880e8400-e29b-41d4-a716-446655440016', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'sms'::notification_channel, 'sent'::notification_status, '+1234567894', 'FD-2024-005 in transit. Expected arrival in 3 hours.', NULL, NOW() - INTERVAL '30 minutes', 'sms-007'),
  ('880e8400-e29b-41d4-a716-446655440017', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'email'::notification_channel, 'sent'::notification_status, 'alice.williams@example.com', 'Shipment FD-2024-004 scheduled for delivery in 6 hours.', NULL, NOW() - INTERVAL '2 hours', 'msg-011'),

  -- Failed notifications
  ('880e8400-e29b-41d4-a716-446655440018', '770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'sms'::notification_channel, 'failed'::notification_status, '+1234567892', 'Failed to send SMS notification for FD-2024-008.', NULL, NULL, NULL),
  ('880e8400-e29b-41d4-a716-446655440019', '770e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005', 'email'::notification_channel, 'failed'::notification_status, 'david.miller@example.com', 'Email delivery failed for FD-2024-011 notification.', NULL, NULL, NULL),

  -- Pending notifications
  ('880e8400-e29b-41d4-a716-446655440020', '770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440006', 'email'::notification_channel, 'pending'::notification_status, 'emily.davis@example.com', 'Your delivery FD-2024-015 is scheduled for tomorrow.', NULL, NULL, NULL),
  ('880e8400-e29b-41d4-a716-446655440021', '770e8400-e29b-41d4-a716-446655440038', '550e8400-e29b-41d4-a716-446655440014', 'sms'::notification_channel, 'pending'::notification_status, '+1234567804', 'FD-2024-039 notification pending.', NULL, NULL, NULL),

  -- Cancellation notifications
  ('880e8400-e29b-41d4-a716-446655440022', '770e8400-e29b-41d4-a716-446655440047', '550e8400-e29b-41d4-a716-446655440017', 'email'::notification_channel, 'sent'::notification_status, 'paul.garcia@example.com', 'Delivery FD-2024-048 has been cancelled as requested.', NULL, NOW() - INTERVAL '2 hours', 'msg-012'),
  ('880e8400-e29b-41d4-a716-446655440023', '770e8400-e29b-41d4-a716-446655440048', '550e8400-e29b-41d4-a716-446655440018', 'sms'::notification_channel, 'sent'::notification_status, '+1234567808', 'Cancelled: FD-2024-049. Contact support for details.', NULL, NOW() - INTERVAL '1 hour', 'sms-008'),
  ('880e8400-e29b-41d4-a716-446655440024', '770e8400-e29b-41d4-a716-446655440049', '550e8400-e29b-41d4-a716-446655440019', 'email'::notification_channel, 'sent'::notification_status, 'rachel.robinson@example.com', 'Your delivery FD-2024-050 has been cancelled. Refund processed.', NULL, NOW() - INTERVAL '30 minutes', 'msg-013');

-- Insert sample workflow executions (20 total - completed, running, failed, cancelled)
INSERT INTO workflow_executions (id, workflow_id, run_id, delivery_id, status, started_at, completed_at, error_message)
VALUES
  -- Completed workflows
  ('990e8400-e29b-41d4-a716-446655440000', 'delay-notification-FD-2024-002', 'run-001', '770e8400-e29b-41d4-a716-446655440001', 'completed'::workflow_status, NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '30 minutes', NULL),
  ('990e8400-e29b-41d4-a716-446655440001', 'delay-notification-FD-2024-010', 'run-002', '770e8400-e29b-41d4-a716-446655440009', 'completed'::workflow_status, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '15 minutes', NULL),
  ('990e8400-e29b-41d4-a716-446655440002', 'delay-notification-FD-2024-014', 'run-003', '770e8400-e29b-41d4-a716-446655440013', 'completed'::workflow_status, NOW() - INTERVAL '28 minutes', NOW() - INTERVAL '25 minutes', NULL),
  ('990e8400-e29b-41d4-a716-446655440003', 'delay-notification-FD-2024-018', 'run-004', '770e8400-e29b-41d4-a716-446655440017', 'completed'::workflow_status, NOW() - INTERVAL '12 minutes', NOW() - INTERVAL '10 minutes', NULL),
  ('990e8400-e29b-41d4-a716-446655440004', 'delay-notification-FD-2024-021', 'run-005', '770e8400-e29b-41d4-a716-446655440020', 'completed'::workflow_status, NOW() - INTERVAL '48 minutes', NOW() - INTERVAL '45 minutes', NULL),
  ('990e8400-e29b-41d4-a716-446655440005', 'delay-notification-FD-2024-024', 'run-006', '770e8400-e29b-41d4-a716-446655440023', 'completed'::workflow_status, NOW() - INTERVAL '22 minutes', NOW() - INTERVAL '20 minutes', NULL),
  ('990e8400-e29b-41d4-a716-446655440006', 'delay-notification-FD-2024-027', 'run-007', '770e8400-e29b-41d4-a716-446655440026', 'completed'::workflow_status, NOW() - INTERVAL '38 minutes', NOW() - INTERVAL '35 minutes', NULL),
  ('990e8400-e29b-41d4-a716-446655440007', 'delay-notification-FD-2024-030', 'run-008', '770e8400-e29b-41d4-a716-446655440029', 'completed'::workflow_status, NOW() - INTERVAL '52 minutes', NOW() - INTERVAL '50 minutes', NULL),
  ('990e8400-e29b-41d4-a716-446655440008', 'delay-notification-FD-2024-033', 'run-009', '770e8400-e29b-41d4-a716-446655440032', 'completed'::workflow_status, NOW() - INTERVAL '14 minutes', NOW() - INTERVAL '12 minutes', NULL),
  ('990e8400-e29b-41d4-a716-446655440009', 'delay-notification-FD-2024-036', 'run-010', '770e8400-e29b-41d4-a716-446655440035', 'completed'::workflow_status, NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '38 minutes', NULL),
  ('990e8400-e29b-41d4-a716-446655440010', 'delivery-confirmation-FD-2024-003', 'run-011', '770e8400-e29b-41d4-a716-446655440002', 'completed'::workflow_status, NOW() - INTERVAL '23 hours 5 minutes', NOW() - INTERVAL '23 hours', NULL),
  ('990e8400-e29b-41d4-a716-446655440011', 'delivery-confirmation-FD-2024-020', 'run-012', '770e8400-e29b-41d4-a716-446655440019', 'completed'::workflow_status, NOW() - INTERVAL '11 hours 5 minutes', NOW() - INTERVAL '11 hours', NULL),

  -- Running workflows
  ('990e8400-e29b-41d4-a716-446655440012', 'traffic-check-FD-2024-001', 'run-013', '770e8400-e29b-41d4-a716-446655440000', 'running'::workflow_status, NOW() - INTERVAL '5 minutes', NULL, NULL),
  ('990e8400-e29b-41d4-a716-446655440013', 'traffic-check-FD-2024-005', 'run-014', '770e8400-e29b-41d4-a716-446655440004', 'running'::workflow_status, NOW() - INTERVAL '3 minutes', NULL, NULL),
  ('990e8400-e29b-41d4-a716-446655440014', 'traffic-check-FD-2024-012', 'run-015', '770e8400-e29b-41d4-a716-446655440011', 'running'::workflow_status, NOW() - INTERVAL '8 minutes', NULL, NULL),

  -- Failed workflows
  ('990e8400-e29b-41d4-a716-446655440015', 'delay-notification-FD-2024-008', 'run-016', '770e8400-e29b-41d4-a716-446655440007', 'failed'::workflow_status, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '44 minutes', 'SMS service unavailable'),
  ('990e8400-e29b-41d4-a716-446655440016', 'traffic-check-FD-2024-011', 'run-017', '770e8400-e29b-41d4-a716-446655440010', 'failed'::workflow_status, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '59 minutes', 'Google Maps API rate limit exceeded'),

  -- Cancelled workflows
  ('990e8400-e29b-41d4-a716-446655440017', 'delay-notification-FD-2024-048', 'run-018', '770e8400-e29b-41d4-a716-446655440047', 'cancelled'::workflow_status, NOW() - INTERVAL '2 hours 10 minutes', NOW() - INTERVAL '2 hours', NULL),
  ('990e8400-e29b-41d4-a716-446655440018', 'traffic-check-FD-2024-049', 'run-019', '770e8400-e29b-41d4-a716-446655440048', 'cancelled'::workflow_status, NOW() - INTERVAL '1 hour 15 minutes', NOW() - INTERVAL '1 hour', NULL),
  ('990e8400-e29b-41d4-a716-446655440019', 'delay-notification-FD-2024-050', 'run-020', '770e8400-e29b-41d4-a716-446655440049', 'cancelled'::workflow_status, NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '30 minutes', NULL);

-- Insert sample traffic snapshots (30 total - showing traffic patterns)
INSERT INTO traffic_snapshots (id, route_id, traffic_condition, delay_minutes, duration_seconds, snapshot_at)
VALUES
  -- Recent snapshots for active routes (heavy traffic)
  ('aa0e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'heavy'::traffic_condition, 35, 2700, NOW() - INTERVAL '5 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'heavy'::traffic_condition, 45, 3900, NOW() - INTERVAL '3 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 'heavy'::traffic_condition, 55, 12600, NOW() - INTERVAL '8 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440007', 'heavy'::traffic_condition, 28, 3120, NOW() - INTERVAL '12 minutes'),

  -- Moderate traffic snapshots
  ('aa0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 'moderate'::traffic_condition, 20, 5400, NOW() - INTERVAL '10 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440003', 'moderate'::traffic_condition, 15, 2400, NOW() - INTERVAL '15 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440005', 'moderate'::traffic_condition, 8, 1080, NOW() - INTERVAL '18 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440008', 'moderate'::traffic_condition, 25, 6480, NOW() - INTERVAL '22 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440011', 'moderate'::traffic_condition, 12, 2520, NOW() - INTERVAL '25 minutes'),

  -- Light traffic snapshots
  ('aa0e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440006', 'light'::traffic_condition, 5, 2880, NOW() - INTERVAL '30 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440009', 'light'::traffic_condition, 3, 1920, NOW() - INTERVAL '35 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440010', 'light'::traffic_condition, 2, 1560, NOW() - INTERVAL '40 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440012', 'light'::traffic_condition, 4, 1920, NOW() - INTERVAL '45 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440013', 'light'::traffic_condition, 6, 1680, NOW() - INTERVAL '50 minutes'),

  -- Normal traffic snapshots
  ('aa0e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440014', 'normal'::traffic_condition, 0, 2400, NOW() - INTERVAL '55 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440000', 'normal'::traffic_condition, 0, 1800, NOW() - INTERVAL '1 hour'),
  ('aa0e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440001', 'normal'::traffic_condition, 0, 2700, NOW() - INTERVAL '1 hour 10 minutes'),

  -- Historical snapshots showing traffic pattern changes
  ('aa0e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440000', 'light'::traffic_condition, 5, 1920, NOW() - INTERVAL '2 hours'),
  ('aa0e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440000', 'moderate'::traffic_condition, 18, 2280, NOW() - INTERVAL '3 hours'),
  ('aa0e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440001', 'light'::traffic_condition, 8, 2940, NOW() - INTERVAL '2 hours 30 minutes'),
  ('aa0e8400-e29b-41d4-a716-446655440020', '660e8400-e29b-41d4-a716-446655440001', 'moderate'::traffic_condition, 22, 3480, NOW() - INTERVAL '4 hours'),
  ('aa0e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440002', 'normal'::traffic_condition, 0, 4500, NOW() - INTERVAL '5 hours'),
  ('aa0e8400-e29b-41d4-a716-446655440022', '660e8400-e29b-41d4-a716-446655440003', 'heavy'::traffic_condition, 38, 2880, NOW() - INTERVAL '6 hours'),
  ('aa0e8400-e29b-41d4-a716-446655440023', '660e8400-e29b-41d4-a716-446655440004', 'moderate'::traffic_condition, 42, 11520, NOW() - INTERVAL '7 hours'),
  ('aa0e8400-e29b-41d4-a716-446655440024', '660e8400-e29b-41d4-a716-446655440005', 'light'::traffic_condition, 2, 960, NOW() - INTERVAL '8 hours'),
  ('aa0e8400-e29b-41d4-a716-446655440025', '660e8400-e29b-41d4-a716-446655440006', 'normal'::traffic_condition, 0, 2700, NOW() - INTERVAL '10 hours'),
  ('aa0e8400-e29b-41d4-a716-446655440026', '660e8400-e29b-41d4-a716-446655440007', 'light'::traffic_condition, 7, 2640, NOW() - INTERVAL '12 hours'),
  ('aa0e8400-e29b-41d4-a716-446655440027', '660e8400-e29b-41d4-a716-446655440008', 'moderate'::traffic_condition, 32, 6240, NOW() - INTERVAL '14 hours'),
  ('aa0e8400-e29b-41d4-a716-446655440028', '660e8400-e29b-41d4-a716-446655440009', 'normal'::traffic_condition, 0, 1800, NOW() - INTERVAL '16 hours'),
  ('aa0e8400-e29b-41d4-a716-446655440029', '660e8400-e29b-41d4-a716-446655440010', 'light'::traffic_condition, 4, 1680, NOW() - INTERVAL '18 hours');