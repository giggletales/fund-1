/*
  # Create Remaining Tables - Part 3

  Continuing with:
  - Monitoring & Analytics Tables
  - Advanced Trading Tables  
  - Affiliate & Referral Tables
  - Competition Tables
  - Admin & Settings Tables
*/

-- ============================================================
-- MONITORING & ANALYTICS TABLES
-- ============================================================

-- Rate Limit Violations
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID,
  violation_type TEXT NOT NULL,
  violation_details JSONB,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_user_id ON rate_limit_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_challenge ON rate_limit_violations(challenge_id);

ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limit violations"
  ON rate_limit_violations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Rule Violations
CREATE TABLE IF NOT EXISTS rule_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID,
  rule_name TEXT NOT NULL,
  violation_details TEXT,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('warning', 'critical')),
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rule_violations_user_id ON rule_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_rule_violations_challenge ON rule_violations(challenge_id);

ALTER TABLE rule_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rule violations"
  ON rule_violations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Warning Log
CREATE TABLE IF NOT EXISTS warning_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID,
  warning_key TEXT,
  warning_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warning_log_challenge ON warning_log(challenge_id);

ALTER TABLE warning_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view warnings for own challenges"
  ON warning_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = warning_log.challenge_id
      AND challenges.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_challenges
      WHERE user_challenges.id = warning_log.challenge_id
      AND user_challenges.user_id = auth.uid()
    )
  );

-- Trade Analytics
CREATE TABLE IF NOT EXISTS trade_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  calculation_date DATE DEFAULT CURRENT_DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_analytics_user_id ON trade_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_analytics_challenge ON trade_analytics(challenge_id);
CREATE INDEX IF NOT EXISTS idx_trade_analytics_metric ON trade_analytics(metric_name);

ALTER TABLE trade_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade analytics"
  ON trade_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- ADVANCED TRADING TABLES
-- ============================================================

-- Equities Challenges
CREATE TABLE IF NOT EXISTS equities_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_size NUMERIC NOT NULL,
  status TEXT DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equities_challenges_user_id ON equities_challenges(user_id);

ALTER TABLE equities_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own equities challenges"
  ON equities_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Equities Trades
CREATE TABLE IF NOT EXISTS equities_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES equities_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  entry_price NUMERIC(15,2) NOT NULL,
  exit_price NUMERIC(15,2),
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ,
  profit_loss NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equities_trades_challenge ON equities_trades(challenge_id);
CREATE INDEX IF NOT EXISTS idx_equities_trades_user_id ON equities_trades(user_id);

ALTER TABLE equities_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own equities trades"
  ON equities_trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Equities Consistency Metrics
CREATE TABLE IF NOT EXISTS equities_consistency_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES equities_challenges(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  consistency_score NUMERIC(5,2),
  trades_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equities_consistency_challenge ON equities_consistency_metrics(challenge_id);

ALTER TABLE equities_consistency_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own equities consistency"
  ON equities_consistency_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM equities_challenges
      WHERE equities_challenges.id = equities_consistency_metrics.challenge_id
      AND equities_challenges.user_id = auth.uid()
    )
  );

-- Master Challenges
CREATE TABLE IF NOT EXISTS master_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_type TEXT NOT NULL,
  account_size NUMERIC NOT NULL,
  status TEXT DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_challenges_user_id ON master_challenges(user_id);

ALTER TABLE master_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own master challenges"
  ON master_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Master Challenge Trades
CREATE TABLE IF NOT EXISTS master_challenge_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES master_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  volume NUMERIC(10,2) NOT NULL,
  entry_price NUMERIC(15,5) NOT NULL,
  exit_price NUMERIC(15,5),
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ,
  profit_loss NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_challenge_trades_challenge ON master_challenge_trades(challenge_id);

ALTER TABLE master_challenge_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own master challenge trades"
  ON master_challenge_trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Master Challenge Violations
CREATE TABLE IF NOT EXISTS master_challenge_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES master_challenges(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  violation_details TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_challenge_violations_challenge ON master_challenge_violations(challenge_id);

ALTER TABLE master_challenge_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own master challenge violations"
  ON master_challenge_violations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM master_challenges
      WHERE master_challenges.id = master_challenge_violations.challenge_id
      AND master_challenges.user_id = auth.uid()
    )
  );

-- Master Challenge Momentum
CREATE TABLE IF NOT EXISTS master_challenge_momentum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES master_challenges(id) ON DELETE CASCADE,
  calculation_date DATE NOT NULL,
  momentum_score NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_challenge_momentum_challenge ON master_challenge_momentum(challenge_id);

ALTER TABLE master_challenge_momentum ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own master challenge momentum"
  ON master_challenge_momentum FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM master_challenges
      WHERE master_challenges.id = master_challenge_momentum.challenge_id
      AND master_challenges.user_id = auth.uid()
    )
  );

-- Master Challenge Sector Rotation
CREATE TABLE IF NOT EXISTS master_challenge_sector_rotation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES master_challenges(id) ON DELETE CASCADE,
  sector_name TEXT NOT NULL,
  allocation_percent NUMERIC(5,2),
  rotation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_challenge_sector_rotation_challenge ON master_challenge_sector_rotation(challenge_id);

ALTER TABLE master_challenge_sector_rotation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sector rotation"
  ON master_challenge_sector_rotation FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM master_challenges
      WHERE master_challenges.id = master_challenge_sector_rotation.challenge_id
      AND master_challenges.user_id = auth.uid()
    )
  );

-- Consistency Scores
CREATE TABLE IF NOT EXISTS consistency_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID,
  score NUMERIC(5,2),
  calculation_date DATE DEFAULT CURRENT_DATE,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consistency_scores_user_id ON consistency_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_consistency_scores_challenge ON consistency_scores(challenge_id);

ALTER TABLE consistency_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consistency scores"
  ON consistency_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Sector Exposure
CREATE TABLE IF NOT EXISTS sector_exposure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID,
  sector_name TEXT NOT NULL,
  exposure_percent NUMERIC(5,2),
  exposure_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sector_exposure_user_id ON sector_exposure(user_id);
CREATE INDEX IF NOT EXISTS idx_sector_exposure_challenge ON sector_exposure(challenge_id);

ALTER TABLE sector_exposure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sector exposure"
  ON sector_exposure FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Advanced Metrics Cache
CREATE TABLE IF NOT EXISTS advanced_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID,
  metric_type TEXT NOT NULL,
  metric_data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_advanced_metrics_cache_user ON advanced_metrics_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_advanced_metrics_cache_challenge ON advanced_metrics_cache(challenge_id);
CREATE INDEX IF NOT EXISTS idx_advanced_metrics_cache_expires ON advanced_metrics_cache(expires_at);

ALTER TABLE advanced_metrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics cache"
  ON advanced_metrics_cache FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- AFFILIATE & REFERRAL TABLES
-- ============================================================

-- Affiliates
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  affiliate_code TEXT UNIQUE NOT NULL,
  commission_rate NUMERIC(5,2) DEFAULT 10.00,
  total_referrals INTEGER DEFAULT 0,
  total_earnings NUMERIC(15,2) DEFAULT 0,
  pending_earnings NUMERIC(15,2) DEFAULT 0,
  paid_earnings NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate data"
  ON affiliates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'cancelled')),
  commission_earned NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON referrals(referred_user_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = referrals.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

-- Commissions
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  commission_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = commissions.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

-- Payouts Affiliate
CREATE TABLE IF NOT EXISTS payouts_affiliate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payout_method TEXT,
  payout_details TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payouts_affiliate_affiliate ON payouts_affiliate(affiliate_id);

ALTER TABLE payouts_affiliate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own payouts"
  ON payouts_affiliate FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = payouts_affiliate.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

-- ============================================================
-- COMPETITION TABLES
-- ============================================================

-- Competitions
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  prize_pool NUMERIC(15,2),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_dates ON competitions(start_date, end_date);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active competitions"
  ON competitions FOR SELECT
  TO authenticated, anon
  USING (status IN ('upcoming', 'active'));

-- Competition Participants
CREATE TABLE IF NOT EXISTS competition_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID,
  rank INTEGER,
  score NUMERIC(15,2),
  prize_won NUMERIC(15,2),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competition_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_competition_participants_competition ON competition_participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_participants_user ON competition_participants(user_id);

ALTER TABLE competition_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competition participants"
  ON competition_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join competitions"
  ON competition_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- ADMIN & SETTINGS TABLES
-- ============================================================

-- Admin Roles
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'support', 'manager', 'developer')),
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Platform Settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON platform_settings FOR SELECT
  TO authenticated, anon
  USING (true);

-- Insert default settings
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES
  ('min_payout_amount', '100', 'Minimum payout amount in USD'),
  ('payout_processing_time_hours', '48', 'Standard payout processing time'),
  ('phase1_profit_target_percent', '8', 'Phase 1 profit target percentage'),
  ('phase2_profit_target_percent', '5', 'Phase 2 profit target percentage'),
  ('max_drawdown_percent', '6', 'Maximum drawdown percentage for evaluations'),
  ('funded_max_drawdown_percent', '8', 'Maximum drawdown for funded accounts'),
  ('daily_loss_limit_percent', '3', 'Daily loss limit percentage'),
  ('min_trading_days', '5', 'Minimum required trading days per phase')
ON CONFLICT (setting_key) DO NOTHING;

-- PDT Tracker
CREATE TABLE IF NOT EXISTS pdt_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID,
  day_trade_count INTEGER DEFAULT 0,
  tracking_period_start DATE NOT NULL,
  tracking_period_end DATE NOT NULL,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdt_tracker_user_id ON pdt_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_pdt_tracker_challenge ON pdt_tracker(challenge_id);

ALTER TABLE pdt_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pdt tracker"
  ON pdt_tracker FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Account Metrics
CREATE TABLE IF NOT EXISTS account_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  metric_date DATE DEFAULT CURRENT_DATE,
  balance NUMERIC(15,2),
  equity NUMERIC(15,2),
  profit_loss NUMERIC(15,2),
  win_rate NUMERIC(5,2),
  total_trades INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_metrics_account ON account_metrics(account_id);
CREATE INDEX IF NOT EXISTS idx_account_metrics_date ON account_metrics(metric_date);

ALTER TABLE account_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics for own accounts"
  ON account_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mt5_accounts
      WHERE mt5_accounts.account_id = account_metrics.account_id
      AND mt5_accounts.user_id = auth.uid()
    )
  );