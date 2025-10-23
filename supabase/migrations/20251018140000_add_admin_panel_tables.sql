/*
  # Admin MT5 Panel - Complete System

  1. New Tables
    - competitions
    - competition_participants
    - manual_action_logs

  2. Updates
    - Add fields to downloads for invoices/receipts
    - Add RLS policies for admin operations
*/

-- Competitions Table
CREATE TABLE IF NOT EXISTS competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  competition_type text NOT NULL CHECK (competition_type IN ('PROFIT_TARGET', 'HIGHEST_PROFIT', 'CONSISTENCY', 'WIN_RATE', 'CUSTOM')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  registration_deadline timestamptz,
  status text NOT NULL CHECK (status IN ('draft', 'upcoming', 'active', 'completed', 'cancelled')) DEFAULT 'draft',
  max_participants integer,
  prizes jsonb DEFAULT '[]'::jsonb,
  rules jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Competition Participants
CREATE TABLE IF NOT EXISTS competition_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid REFERENCES competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  challenge_id uuid REFERENCES user_challenges(id),
  registered_at timestamptz DEFAULT now(),
  current_rank integer,
  current_score numeric DEFAULT 0,
  status text CHECK (status IN ('registered', 'active', 'disqualified', 'completed')) DEFAULT 'registered',
  disqualification_reason text,
  stats jsonb DEFAULT '{}'::jsonb
);

-- Manual Action Logs
CREATE TABLE IF NOT EXISTS manual_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (action_type IN ('CERTIFICATE_SENT', 'ACCOUNT_BREACHED', 'ACCOUNT_REINSTATED', 'PAYOUT_APPROVED', 'USER_SUSPENDED', 'COMPETITION_CREATED')),
  target_user_id uuid,
  target_challenge_id uuid REFERENCES user_challenges(id),
  action_data jsonb DEFAULT '{}'::jsonb,
  admin_id uuid REFERENCES auth.users(id),
  admin_email text,
  ip_address text,
  user_agent text,
  status text CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'completed',
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Update downloads table for invoices and receipts
ALTER TABLE downloads ADD COLUMN IF NOT EXISTS amount numeric;
ALTER TABLE downloads ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE downloads ADD COLUMN IF NOT EXISTS transaction_id text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_competition_participants_comp ON competition_participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_manual_logs_admin ON manual_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_manual_logs_target ON manual_action_logs(target_user_id);

-- Enable RLS
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_action_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitions (admins can do everything)
CREATE POLICY "Admins can manage competitions"
  ON competitions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.email LIKE '%@fund8r.com')
    )
  );

-- Users can view active competitions
CREATE POLICY "Users can view active competitions"
  ON competitions FOR SELECT
  TO authenticated
  USING (status IN ('active', 'upcoming', 'completed'));

-- RLS for competition participants
CREATE POLICY "Admins can manage participants"
  ON competition_participants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.email LIKE '%@fund8r.com')
    )
  );

-- Users can view their own participation
CREATE POLICY "Users can view own participation"
  ON competition_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS for manual action logs (admins only)
CREATE POLICY "Admins can view action logs"
  ON manual_action_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.email LIKE '%@fund8r.com')
    )
  );

CREATE POLICY "Admins can insert action logs"
  ON manual_action_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.email LIKE '%@fund8r.com')
    )
  );
