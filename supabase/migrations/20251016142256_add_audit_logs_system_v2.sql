/*
  # Add Audit Logs System

  1. New Tables
    - `audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `action` (text)
      - `resource_type` (text)
      - `resource_id` (uuid)
      - `ip_address` (text)
      - `user_agent` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
    
    - `rate_limit_violations`
      - `id` (uuid, primary key)
      - `ip_address` (text)
      - `endpoint` (text)
      - `violation_count` (integer)
      - `blocked_until` (timestamptz)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on audit_logs
    - Users can only view their own audit logs
    - Rate limit violations table is admin-only
  
  3. Indexes
    - Index on user_id for fast audit log queries
    - Index on ip_address for rate limit checks
    - Index on created_at for time-based queries
*/

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create rate_limit_violations table
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  endpoint text NOT NULL,
  violation_count integer DEFAULT 1,
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_ip ON rate_limit_violations(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_created_at ON rate_limit_violations(created_at);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;