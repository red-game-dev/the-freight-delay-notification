-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE delivery_status AS ENUM (
  'pending',
  'in_transit',
  'delayed',
  'delivered',
  'cancelled',
  'failed'
);

CREATE TYPE traffic_condition AS ENUM (
  'light',
  'normal',
  'moderate',
  'heavy',
  'severe'
);

CREATE TYPE notification_channel AS ENUM (
  'email',
  'sms'
);

CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'failed',
  'skipped'
);

CREATE TYPE workflow_status AS ENUM (
  'running',
  'completed',
  'failed',
  'cancelled',
  'timed_out'
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  name VARCHAR(255) NOT NULL,
  notification_preferences JSONB DEFAULT '{"primary": "email", "secondary": "sms"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routes table
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_address TEXT NOT NULL,
  origin_coords POINT NOT NULL,
  destination_address TEXT NOT NULL,
  destination_coords POINT NOT NULL,
  distance_meters INTEGER NOT NULL,
  normal_duration_seconds INTEGER NOT NULL,
  current_duration_seconds INTEGER,
  traffic_condition traffic_condition,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deliveries table
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  route_id UUID NOT NULL REFERENCES routes(id),
  status delivery_status DEFAULT 'pending',
  scheduled_delivery TIMESTAMPTZ NOT NULL,
  actual_delivery TIMESTAMPTZ,
  current_location POINT,
  delay_threshold_minutes INTEGER DEFAULT 30,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  channel notification_channel NOT NULL,
  status notification_status DEFAULT 'pending',
  message TEXT NOT NULL,
  delay_minutes INTEGER,
  sent_at TIMESTAMPTZ,
  external_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traffic snapshots table (for monitoring)
CREATE TABLE traffic_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id),
  traffic_condition traffic_condition NOT NULL,
  delay_minutes INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow executions table (for Temporal tracking)
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id VARCHAR(255) NOT NULL,
  run_id VARCHAR(255) NOT NULL,
  delivery_id UUID REFERENCES deliveries(id),
  status workflow_status DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(workflow_id, run_id)
);

-- Create indexes for performance
CREATE INDEX idx_deliveries_customer_id ON deliveries(customer_id);
CREATE INDEX idx_deliveries_route_id ON deliveries(route_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_scheduled ON deliveries(scheduled_delivery);
CREATE INDEX idx_notifications_delivery_id ON notifications(delivery_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_traffic_snapshots_route_id ON traffic_snapshots(route_id);
CREATE INDEX idx_traffic_snapshots_time ON traffic_snapshots(snapshot_at);
CREATE INDEX idx_workflow_executions_delivery_id ON workflow_executions(delivery_id);

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();