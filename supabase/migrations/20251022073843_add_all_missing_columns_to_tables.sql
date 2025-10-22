/*
  # Add All Missing Columns to Database Tables

  This migration adds all columns that the frontend code expects but are missing from the database.

  1. user_challenges table - Add missing columns
  2. challenge_types table - Ensure complete schema
  3. challenge_pricing table - Add profit target columns
  4. Other tables as needed
*/

-- ============================================================
-- USER_CHALLENGES TABLE - Add All Missing Columns
-- ============================================================

DO $$
BEGIN
  -- Add trading_account_id (replaces mt5_login)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'trading_account_id') THEN
    ALTER TABLE user_challenges ADD COLUMN trading_account_id TEXT;
  END IF;

  -- Add trading_account_password (replaces mt5_password)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'trading_account_password') THEN
    ALTER TABLE user_challenges ADD COLUMN trading_account_password TEXT;
  END IF;

  -- Add trading_account_server (replaces mt5_server)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'trading_account_server') THEN
    ALTER TABLE user_challenges ADD COLUMN trading_account_server TEXT DEFAULT 'MetaQuotes-Demo';
  END IF;

  -- Add credentials_visible flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'credentials_visible') THEN
    ALTER TABLE user_challenges ADD COLUMN credentials_visible BOOLEAN DEFAULT false;
  END IF;

  -- Add credentials_sent flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'credentials_sent') THEN
    ALTER TABLE user_challenges ADD COLUMN credentials_sent BOOLEAN DEFAULT false;
  END IF;

  -- Add contract_signed flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'contract_signed') THEN
    ALTER TABLE user_challenges ADD COLUMN contract_signed BOOLEAN DEFAULT false;
  END IF;

  -- Add challenge_type_id foreign key
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'challenge_type_id') THEN
    ALTER TABLE user_challenges ADD COLUMN challenge_type_id UUID;
    ALTER TABLE user_challenges ADD CONSTRAINT fk_user_challenges_challenge_type 
      FOREIGN KEY (challenge_type_id) REFERENCES challenge_types(id);
  END IF;

  -- Add payment_method
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'payment_method') THEN
    ALTER TABLE user_challenges ADD COLUMN payment_method TEXT;
  END IF;

  -- Add payment_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'payment_status') THEN
    ALTER TABLE user_challenges ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;

  -- Add price_paid
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'price_paid') THEN
    ALTER TABLE user_challenges ADD COLUMN price_paid NUMERIC(10,2);
  END IF;

  -- Add profit_split
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'profit_split') THEN
    ALTER TABLE user_challenges ADD COLUMN profit_split NUMERIC(5,2) DEFAULT 80.00;
  END IF;

  -- Add phase_1_profit_target
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'phase_1_profit_target') THEN
    ALTER TABLE user_challenges ADD COLUMN phase_1_profit_target NUMERIC(10,2);
  END IF;

  -- Add phase_2_profit_target
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'phase_2_profit_target') THEN
    ALTER TABLE user_challenges ADD COLUMN phase_2_profit_target NUMERIC(10,2);
  END IF;

  -- Add max_daily_loss
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'max_daily_loss') THEN
    ALTER TABLE user_challenges ADD COLUMN max_daily_loss NUMERIC(5,2) DEFAULT 5.00;
  END IF;

  -- Add max_total_loss  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'max_total_loss') THEN
    ALTER TABLE user_challenges ADD COLUMN max_total_loss NUMERIC(5,2) DEFAULT 10.00;
  END IF;

  -- Add min_trading_days
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'min_trading_days') THEN
    ALTER TABLE user_challenges ADD COLUMN min_trading_days INTEGER DEFAULT 4;
  END IF;

  -- Add time_limit_days
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'time_limit_days') THEN
    ALTER TABLE user_challenges ADD COLUMN time_limit_days INTEGER;
  END IF;

  -- Add consistency_rule (max profit per day percentage)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'consistency_rule') THEN
    ALTER TABLE user_challenges ADD COLUMN consistency_rule NUMERIC(5,2);
  END IF;

  -- Add current_profit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'current_profit') THEN
    ALTER TABLE user_challenges ADD COLUMN current_profit NUMERIC(10,2) DEFAULT 0.00;
  END IF;

  -- Add current_balance
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'current_balance') THEN
    ALTER TABLE user_challenges ADD COLUMN current_balance NUMERIC(10,2);
  END IF;

  -- Add trading_days_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'trading_days_count') THEN
    ALTER TABLE user_challenges ADD COLUMN trading_days_count INTEGER DEFAULT 0;
  END IF;

  -- Add passed_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'passed_at') THEN
    ALTER TABLE user_challenges ADD COLUMN passed_at TIMESTAMPTZ;
  END IF;

  -- Add failed_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'failed_at') THEN
    ALTER TABLE user_challenges ADD COLUMN failed_at TIMESTAMPTZ;
  END IF;

  -- Add failure_reason
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_challenges' AND column_name = 'failure_reason') THEN
    ALTER TABLE user_challenges ADD COLUMN failure_reason TEXT;
  END IF;
END $$;

-- Copy data from old columns to new columns if they have data
UPDATE user_challenges 
SET 
  trading_account_id = COALESCE(trading_account_id, mt5_login),
  trading_account_password = COALESCE(trading_account_password, mt5_password),
  trading_account_server = COALESCE(trading_account_server, mt5_server),
  current_balance = COALESCE(current_balance, account_size)
WHERE trading_account_id IS NULL OR trading_account_password IS NULL OR current_balance IS NULL;

-- Update challenge_type_id from challenge_type text
UPDATE user_challenges uc
SET challenge_type_id = ct.id
FROM challenge_types ct
WHERE uc.challenge_type = ct.type_name
  AND uc.challenge_type_id IS NULL;

-- ============================================================
-- CHALLENGE_PRICING TABLE - Add Profit Target Columns
-- ============================================================

DO $$
BEGIN
  -- Add profit_target_pct (single phase challenges)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'profit_target_pct') THEN
    ALTER TABLE challenge_pricing ADD COLUMN profit_target_pct NUMERIC(5,2);
  END IF;

  -- Add profit_target_amount (calculated from account_size * profit_target_pct)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'profit_target_amount') THEN
    ALTER TABLE challenge_pricing ADD COLUMN profit_target_amount NUMERIC(10,2);
  END IF;

  -- Add phase_1_target_pct
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'phase_1_target_pct') THEN
    ALTER TABLE challenge_pricing ADD COLUMN phase_1_target_pct NUMERIC(5,2);
  END IF;

  -- Add phase_2_target_pct
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'phase_2_target_pct') THEN
    ALTER TABLE challenge_pricing ADD COLUMN phase_2_target_pct NUMERIC(5,2);
  END IF;

  -- Add phase_1_target_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'phase_1_target_amount') THEN
    ALTER TABLE challenge_pricing ADD COLUMN phase_1_target_amount NUMERIC(10,2);
  END IF;

  -- Add phase_2_target_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'phase_2_target_amount') THEN
    ALTER TABLE challenge_pricing ADD COLUMN phase_2_target_amount NUMERIC(10,2);
  END IF;
END $$;

-- Update profit targets based on challenge type
UPDATE challenge_pricing cp
SET 
  phase_1_target_pct = ct.phase1_profit_target,
  phase_2_target_pct = ct.phase2_profit_target,
  phase_1_target_amount = (cp.account_size * ct.phase1_profit_target / 100),
  phase_2_target_amount = (cp.account_size * ct.phase2_profit_target / 100),
  profit_target_pct = CASE 
    WHEN ct.phase_count = 1 THEN ct.phase1_profit_target 
    ELSE NULL 
  END,
  profit_target_amount = CASE 
    WHEN ct.phase_count = 1 THEN (cp.account_size * ct.phase1_profit_target / 100)
    ELSE NULL 
  END
FROM challenge_types ct
WHERE cp.challenge_type_id = ct.id
  AND (cp.phase_1_target_pct IS NULL OR cp.phase_2_target_pct IS NULL);

-- ============================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_type_id ON user_challenges(challenge_type_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_purchase_date ON user_challenges(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_challenges_trading_account ON user_challenges(trading_account_id);

-- ============================================================
-- UPDATE RLS POLICIES FOR NEW COLUMNS
-- ============================================================

-- Ensure users can see their own challenges with all columns
DROP POLICY IF EXISTS "Users can view own challenges" ON user_challenges;
CREATE POLICY "Users can view own challenges" 
  ON user_challenges FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow users to update certain fields of their own challenges
DROP POLICY IF EXISTS "Users can update own challenges" ON user_challenges;
CREATE POLICY "Users can update own challenges" 
  ON user_challenges FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to insert their own challenges
DROP POLICY IF EXISTS "Users can insert own challenges" ON user_challenges;
CREATE POLICY "Users can insert own challenges" 
  ON user_challenges FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- VERIFY DATA INTEGRITY
-- ============================================================

-- Ensure all challenges have a status
UPDATE user_challenges 
SET status = CASE
  WHEN trading_account_id IS NOT NULL AND contract_signed = true THEN 'active'
  WHEN trading_account_id IS NOT NULL AND contract_signed = false THEN 'pending_contract'
  WHEN payment_status = 'completed' THEN 'pending_credentials'
  ELSE 'pending_payment'
END
WHERE status IS NULL OR status = '';

-- Set default values for challenges without certain fields
UPDATE user_challenges 
SET 
  credentials_visible = COALESCE(credentials_visible, credentials_sent, false),
  contract_signed = COALESCE(contract_signed, contract_accepted, false),
  current_phase = COALESCE(current_phase, 1),
  profit_split = COALESCE(profit_split, 80.00)
WHERE credentials_visible IS NULL OR contract_signed IS NULL OR current_phase IS NULL OR profit_split IS NULL;