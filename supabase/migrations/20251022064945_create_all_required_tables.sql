/*
  # Create All Required Tables for Fund8r Platform

  1. Core Tables
    - users (via auth.users)
    - user_profile - Extended user information with friendly IDs
    - challenges - Main challenge records
    - user_challenges - User challenge purchases and state
    - challenge_types - Challenge type definitions
    - challenge_pricing - Pricing matrix
    - challenge_rules - Rule definitions per challenge type

  2. Trading & MT5 Tables
    - mt5_accounts - MT5 account credentials and details
    - mt5_trades - Trade history
    - mt5_equity_snapshots - Daily equity tracking
    - mt5_account_status_history - Status change history
    - orders - Trading orders
    - daily_stats - Daily performance statistics
    - daily_performance - Performance metrics

  3. Payment & Financial Tables
    - payments - Payment transactions
    - transactions - Financial transactions
    - payouts - Payout requests
    - coupons - Discount coupons
    - billing_transactions - Billing records

  4. Communication Tables
    - notifications - User notifications
    - support_tickets - Support ticket system
    - ticket_messages - Support conversations
    - email_log - Email delivery tracking
    - email_queue - Email queue for processing

  5. Certificate & Download Tables
    - certificates - Achievement certificates
    - downloads - Downloadable documents

  6. Contract & Compliance Tables
    - contracts - User contracts
    - audit_logs - System audit trail

  7. Monitoring & Analytics Tables
    - validation_results - Rule validation tracking
    - rate_limit_violations - Rate limit breach tracking
    - rule_violations - Trading rule violations
    - warning_log - Warning notifications log
    - trade_analytics - Trade analysis data

  8. Advanced Trading Tables
    - equities_challenges - Equities-specific challenges
    - equities_trades - Equities trade records
    - equities_consistency_metrics - Consistency tracking
    - master_challenges - Master challenge programs
    - master_challenge_trades - Master challenge trades
    - master_challenge_violations - Master challenge violations
    - master_challenge_momentum - Momentum tracking
    - master_challenge_sector_rotation - Sector rotation tracking
    - consistency_scores - Consistency scoring
    - sector_exposure - Sector exposure tracking
    - advanced_metrics_cache - Cached advanced metrics

  9. Affiliate & Referral Tables
    - affiliates - Affiliate program
    - referrals - Referral tracking
    - commissions - Commission tracking

  10. Competition Tables
    - competitions - Trading competitions
    - competition_participants - Competition entries

  11. Admin & Settings Tables
    - admin_roles - Admin role management
    - platform_settings - System configuration
    - pdt_tracker - Pattern Day Trader tracking

  All tables include:
  - Proper Row Level Security (RLS) policies
  - Appropriate indexes for performance
  - Foreign key relationships
  - Security constraints
*/

-- ============================================================
-- CORE USER TABLES
-- ============================================================

-- User Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  friendly_id TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  country TEXT,
  phone TEXT,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES auth.users(id),
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_friendly_id ON user_profile(friendly_id);

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Generate friendly ID function
CREATE OR REPLACE FUNCTION generate_friendly_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate friendly ID
CREATE OR REPLACE FUNCTION set_friendly_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.friendly_id IS NULL THEN
    NEW.friendly_id := generate_friendly_id();
    WHILE EXISTS (SELECT 1 FROM user_profile WHERE friendly_id = NEW.friendly_id) LOOP
      NEW.friendly_id := generate_friendly_id();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_friendly_id_trigger ON user_profile;
CREATE TRIGGER set_friendly_id_trigger
  BEFORE INSERT ON user_profile
  FOR EACH ROW
  EXECUTE FUNCTION set_friendly_id();

-- ============================================================
-- CHALLENGE TABLES
-- ============================================================

-- Challenge Types
CREATE TABLE IF NOT EXISTS challenge_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  phase_count INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_types_active ON challenge_types(is_active);

ALTER TABLE challenge_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenge types"
  ON challenge_types FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Insert default challenge types
INSERT INTO challenge_types (type_name, display_name, description, phase_count) VALUES
  ('standard', 'Standard Challenge', 'Traditional 2-phase evaluation', 2),
  ('rapid', 'Rapid Challenge', 'Fast-track 1-phase evaluation', 1),
  ('professional', 'Professional Challenge', 'Advanced 3-phase evaluation', 3),
  ('swing', 'Swing Trading Challenge', 'Position trading focused', 2),
  ('scaling', 'Scaling Challenge', 'Growth-oriented evaluation', 2)
ON CONFLICT (type_name) DO NOTHING;

-- Challenge Pricing
CREATE TABLE IF NOT EXISTS challenge_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type TEXT NOT NULL,
  account_size NUMERIC NOT NULL,
  phase_1_price NUMERIC NOT NULL,
  phase_2_price NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_pricing_type ON challenge_pricing(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenge_pricing_size ON challenge_pricing(account_size);

ALTER TABLE challenge_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing"
  ON challenge_pricing FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Challenges (legacy table)
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_size NUMERIC(15,2) NOT NULL,
  challenge_fee NUMERIC(10,2) NOT NULL,
  phase TEXT NOT NULL DEFAULT 'phase1',
  status TEXT DEFAULT 'active',
  platform TEXT,
  server_name TEXT,
  login_id TEXT,
  password TEXT,
  investor_password TEXT,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  profit_target NUMERIC(10,2),
  current_balance NUMERIC(15,2),
  highest_balance NUMERIC(15,2),
  current_profit NUMERIC(15,2) DEFAULT 0,
  max_drawdown_percent NUMERIC(5,2) DEFAULT 6.00,
  max_daily_loss_percent NUMERIC(5,2) DEFAULT 3.00,
  current_drawdown_percent NUMERIC(5,2) DEFAULT 0,
  trading_days_completed INTEGER DEFAULT 0,
  trading_days_required INTEGER DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Challenges (new system)
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_type TEXT NOT NULL,
  account_size NUMERIC NOT NULL,
  current_phase INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'passed', 'failed', 'funded', 'breached')),
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  mt5_login TEXT,
  mt5_password TEXT,
  mt5_server TEXT,
  investor_password TEXT,
  contract_accepted BOOLEAN DEFAULT false,
  contract_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);

ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user challenges"
  ON user_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user challenges"
  ON user_challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user challenges"
  ON user_challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- MT5 & TRADING TABLES
-- ============================================================

-- MT5 Accounts
CREATE TABLE IF NOT EXISTS mt5_accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mt5_login VARCHAR(50) NOT NULL,
  mt5_password TEXT NOT NULL,
  mt5_server VARCHAR(255) NOT NULL DEFAULT 'MetaQuotes-Demo',
  investor_password TEXT,
  account_type VARCHAR(50) NOT NULL,
  account_size DECIMAL(15,2) NOT NULL,
  initial_balance DECIMAL(15,2) NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  leverage INTEGER DEFAULT 100,
  status VARCHAR(20) DEFAULT 'active',
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  UNIQUE(mt5_login, mt5_server)
);

CREATE INDEX IF NOT EXISTS idx_mt5_accounts_user_id ON mt5_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_status ON mt5_accounts(status);

ALTER TABLE mt5_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MT5 accounts"
  ON mt5_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- MT5 Trades
CREATE TABLE IF NOT EXISTS mt5_trades (
  trade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES mt5_accounts(account_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_number VARCHAR(50),
  symbol VARCHAR(20) NOT NULL,
  trade_type VARCHAR(10) NOT NULL,
  volume DECIMAL(10,2) NOT NULL,
  open_price DECIMAL(20,5) NOT NULL,
  close_price DECIMAL(20,5),
  stop_loss DECIMAL(20,5),
  take_profit DECIMAL(20,5),
  open_time TIMESTAMPTZ NOT NULL,
  close_time TIMESTAMPTZ,
  profit_loss DECIMAL(15,2),
  commission DECIMAL(15,2) DEFAULT 0,
  swap DECIMAL(15,2) DEFAULT 0,
  net_profit DECIMAL(15,2),
  balance_before DECIMAL(15,2),
  balance_after DECIMAL(15,2),
  comment TEXT,
  magic_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mt5_trades_account_id ON mt5_trades(account_id);
CREATE INDEX IF NOT EXISTS idx_mt5_trades_user_id ON mt5_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_mt5_trades_symbol ON mt5_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_mt5_trades_open_time ON mt5_trades(open_time);

ALTER TABLE mt5_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
  ON mt5_trades FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    account_id IN (SELECT account_id FROM mt5_accounts WHERE user_id = auth.uid())
  );

-- MT5 Equity Snapshots
CREATE TABLE IF NOT EXISTS mt5_equity_snapshots (
  snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES mt5_accounts(account_id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  balance DECIMAL(15,2) NOT NULL,
  equity DECIMAL(15,2) NOT NULL,
  margin DECIMAL(15,2),
  free_margin DECIMAL(15,2),
  margin_level DECIMAL(10,2),
  daily_profit_loss DECIMAL(15,2),
  daily_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_mt5_equity_snapshots_account_date ON mt5_equity_snapshots(account_id, snapshot_date);

ALTER TABLE mt5_equity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own equity snapshots"
  ON mt5_equity_snapshots FOR SELECT
  TO authenticated
  USING (
    account_id IN (SELECT account_id FROM mt5_accounts WHERE user_id = auth.uid())
  );

-- Orders (legacy)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  ticket_number TEXT,
  symbol TEXT,
  order_type TEXT,
  lot_size NUMERIC(10,2),
  open_price NUMERIC(15,5),
  close_price NUMERIC(15,5),
  open_time TIMESTAMPTZ,
  close_time TIMESTAMPTZ,
  profit_loss NUMERIC(15,2),
  commission NUMERIC(10,2),
  swap NUMERIC(10,2),
  net_profit NUMERIC(15,2),
  stop_loss NUMERIC(15,5),
  take_profit NUMERIC(15,5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_challenge_id ON orders(challenge_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orders for own challenges"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = orders.challenge_id
      AND challenges.user_id = auth.uid()
    )
  );

-- Daily Stats
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  starting_balance NUMERIC(15,2),
  ending_balance NUMERIC(15,2),
  daily_profit_loss NUMERIC(15,2),
  daily_loss_percent NUMERIC(5,2),
  trades_opened INTEGER DEFAULT 0,
  trades_closed INTEGER DEFAULT 0,
  is_trading_day BOOLEAN DEFAULT false,
  max_drawdown_reached NUMERIC(5,2),
  breached BOOLEAN DEFAULT false,
  breach_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_challenge_id ON daily_stats(challenge_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view daily stats for own challenges"
  ON daily_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = daily_stats.challenge_id
      AND challenges.user_id = auth.uid()
    )
  );

-- Daily Performance
CREATE TABLE IF NOT EXISTS daily_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_challenge_id UUID REFERENCES user_challenges(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  starting_balance NUMERIC(15,2),
  ending_balance NUMERIC(15,2),
  profit_loss NUMERIC(15,2),
  profit_loss_percent NUMERIC(5,2),
  trades_count INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_challenge_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_performance_challenge ON daily_performance(user_challenge_id);

ALTER TABLE daily_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily performance"
  ON daily_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_challenges
      WHERE user_challenges.id = daily_performance.user_challenge_id
      AND user_challenges.user_id = auth.uid()
    )
  );

-- Continue in next part due to length...
