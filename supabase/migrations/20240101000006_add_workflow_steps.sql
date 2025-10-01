-- Add steps field to workflow_executions for tracking workflow progress
ALTER TABLE workflow_executions
  ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '{}';

-- Add index for querying workflows with specific step status
CREATE INDEX IF NOT EXISTS idx_workflow_executions_steps ON workflow_executions USING gin(steps);
