/*
  # Add Final Missing Tables

  Adding tables that weren't in the previous migrations:
  - pricing_matrix - Alternative pricing structure
  - mt5_account_status_history - MT5 account status tracking
  - users table placeholder (actually uses auth.users)
*/

-- Pricing Matrix (alternative to challenge_pricing)
CREATE TABLE IF NOT EXISTS pricing_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type TEXT NOT NULL,
  account_size NUMERIC NOT NULL,
  phase INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  profit_target_percent NUMERIC,
  max_drawdown_percent NUMERIC,
  daily_loss_limit_percent NUMERIC,
  min_trading_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_type, account_size, phase)
);

CREATE INDEX IF NOT EXISTS idx_pricing_matrix_type ON pricing_matrix(challenge_type);
CREATE INDEX IF NOT EXISTS idx_pricing_matrix_size ON pricing_matrix(account_size);
CREATE INDEX IF NOT EXISTS idx_pricing_matrix_active ON pricing_matrix(is_active);

ALTER TABLE pricing_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing matrix"
  ON pricing_matrix FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- MT5 Account Status History (if mt5_accounts exists)
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

-- Helper view for users (combines auth.users with user_profile)
CREATE OR REPLACE VIEW users AS
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  au.last_sign_in_at,
  up.friendly_id,
  up.first_name,
  up.last_name,
  up.country,
  up.phone,
  up.referral_code,
  up.referred_by,
  up.kyc_status
FROM auth.users au
LEFT JOIN user_profile up ON up.user_id = au.id;

-- Grant access to the view
GRANT SELECT ON users TO authenticated;
