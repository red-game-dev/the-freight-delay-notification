-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Policies for customers
CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (auth.uid()::text = id::text);

-- Policies for deliveries
CREATE POLICY "Service role full access to deliveries" ON deliveries
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for notifications
CREATE POLICY "Service role full access to notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for routes
CREATE POLICY "Service role full access to routes" ON routes
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for traffic snapshots
CREATE POLICY "Service role full access to traffic_snapshots" ON traffic_snapshots
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for workflow executions
CREATE POLICY "Service role full access to workflow_executions" ON workflow_executions
  FOR ALL USING (auth.role() = 'service_role');