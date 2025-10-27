/*
  # Add Email Verifications and Missing Tables

  1. New Tables
    - `email_verifications` - Email verification code management
      - `id` (uuid, primary key)
      - `email` (varchar, unique) - Email to verify
      - `verification_code` (varchar) - 6-digit verification code
      - `is_verified` (boolean) - Verification status
      - `code_expires_at` (timestamptz) - Expiration timestamp
      - `verified_at` (timestamptz) - Verification completion time
      - `attempts` (integer) - Number of verification attempts
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `metaapi_tokens` (if not exists) - MetaAPI token storage
    - `metaapi_accounts` (if not exists) - MetaAPI account management
    - `challenge_rules` (if not exists) - Challenge rule definitions
    - `validation_results` (if not exists) - Rule validation tracking
    - `retry_discounts` (if not exists) - Retry discount management
    - `trading_activity` (if not exists) - Trading activity logs
    - `mt5_account_status_history` (if not exists) - MT5 status history

  2. Security
    - Enable RLS on all tables
    - Public access for email verifications (needed for signup flow)
    - Authenticated access for user-specific tables
    - Admin access where appropriate

  3. Important Notes
    - Email verification uses 6-digit codes with expiration
    - Tracks verification attempts to prevent brute force
    - All tables follow consistent security patterns
*/

-- Create email_verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  verification_code VARCHAR(6) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  code_expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_verified ON email_verifications(is_verified);

ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage verifications" 
  ON email_verifications FOR ALL 
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create metaapi_tokens table if not exists
CREATE TABLE IF NOT EXISTS metaapi_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  account_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE metaapi_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage metaapi tokens"
  ON metaapi_tokens FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create metaapi_accounts table if not exists
CREATE TABLE IF NOT EXISTS metaapi_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT UNIQUE NOT NULL,
  account_name TEXT,
  login TEXT,
  server TEXT,
  platform TEXT,
  connection_status TEXT DEFAULT 'disconnected',
  balance NUMERIC(15,2) DEFAULT 0,
  equity NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metaapi_accounts_user_id ON metaapi_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_metaapi_accounts_account_id ON metaapi_accounts(account_id);

ALTER TABLE metaapi_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metaapi accounts"
  ON metaapi_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage metaapi accounts"
  ON metaapi_accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create challenge_rules table if not exists
CREATE TABLE IF NOT EXISTS challenge_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  rule_value NUMERIC,
  rule_unit TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_rules_type ON challenge_rules(challenge_type);

ALTER TABLE challenge_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenge rules"
  ON challenge_rules FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admins can manage challenge rules"
  ON challenge_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create validation_results table if not exists
CREATE TABLE IF NOT EXISTS validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID,
  rule_id UUID REFERENCES challenge_rules(id) ON DELETE SET NULL,
  validation_status TEXT CHECK (validation_status IN ('passed', 'failed', 'warning')),
  details JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_results_user_id ON validation_results(user_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_challenge_id ON validation_results(challenge_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_status ON validation_results(validation_status);

ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own validation results"
  ON validation_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert validation results"
  ON validation_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create retry_discounts table if not exists
CREATE TABLE IF NOT EXISTS retry_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_challenge_id UUID,
  discount_percent NUMERIC NOT NULL DEFAULT 10,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_retry_discounts_user_id ON retry_discounts(user_id);
CREATE INDEX IF NOT EXISTS idx_retry_discounts_is_used ON retry_discounts(is_used);

ALTER TABLE retry_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own retry discounts"
  ON retry_discounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own retry discounts"
  ON retry_discounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trading_activity table if not exists
CREATE TABLE IF NOT EXISTS trading_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID,
  activity_type TEXT,
  activity_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_activity_user_id ON trading_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_activity_challenge_id ON trading_activity(challenge_id);
CREATE INDEX IF NOT EXISTS idx_trading_activity_timestamp ON trading_activity(timestamp DESC);

ALTER TABLE trading_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trading activity"
  ON trading_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can log trading activity"
  ON trading_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create mt5_account_status_history table if not exists
-- Only if mt5_accounts table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mt5_accounts') THEN
    CREATE TABLE IF NOT EXISTS mt5_account_status_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id UUID,
      old_status TEXT,
      new_status TEXT,
      reason TEXT,
      changed_by UUID REFERENCES auth.users(id),
      changed_at TIMESTAMPTZ DEFAULT NOW(),
      metadata JSONB
    );

    CREATE INDEX IF NOT EXISTS idx_mt5_status_history_account_id ON mt5_account_status_history(account_id);
    CREATE INDEX IF NOT EXISTS idx_mt5_status_history_changed_at ON mt5_account_status_history(changed_at DESC);

    ALTER TABLE mt5_account_status_history ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view status history for own accounts" ON mt5_account_status_history;
    CREATE POLICY "Users can view status history for own accounts"
      ON mt5_account_status_history FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM mt5_accounts
          WHERE mt5_accounts.account_id = mt5_account_status_history.account_id
          AND mt5_accounts.user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Admins can manage status history" ON mt5_account_status_history;
    CREATE POLICY "Admins can manage status history"
      ON mt5_account_status_history FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
      );
  END IF;
END $$;

-- Create trigger for updated_at on email_verifications
CREATE OR REPLACE FUNCTION update_email_verification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_verifications_timestamp ON email_verifications;
CREATE TRIGGER update_email_verifications_timestamp
  BEFORE UPDATE ON email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_email_verification_timestamp();