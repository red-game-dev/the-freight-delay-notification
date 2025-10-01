-- Add policies to allow public (anon key) to read data
-- This allows the frontend to display workflow executions, notifications, and traffic data

-- Allow public read access to deliveries
CREATE POLICY "Anyone can view deliveries" ON deliveries
  FOR SELECT USING (true);

-- Allow public read access to routes
CREATE POLICY "Anyone can view routes" ON routes
  FOR SELECT USING (true);

-- Allow public read access to customers
CREATE POLICY "Anyone can view customers" ON customers
  FOR SELECT USING (true);

-- Allow public read access to notifications
CREATE POLICY "Anyone can view notifications" ON notifications
  FOR SELECT USING (true);

-- Allow public read access to workflow executions
CREATE POLICY "Anyone can view workflow_executions" ON workflow_executions
  FOR SELECT USING (true);

-- Allow public read access to traffic snapshots
CREATE POLICY "Anyone can view traffic_snapshots" ON traffic_snapshots
  FOR SELECT USING (true);

-- Allow public read access to thresholds
CREATE POLICY "Anyone can view thresholds" ON thresholds
  FOR SELECT USING (true);
