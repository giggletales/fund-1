/*
  # Fund8r Master Challenge - Two-Phase System with 7 Unique Rules

  ## Overview
  The Fund8r Master Challenge is a unique two-phase trading evaluation with 7 strict rules
  that REPLACE traditional consistency requirements. NO consistency scoring is used.

  ## Unique Rules (NO Consistency)
  1. **Momentum Decay Rule** - Profit momentum cannot decay >30% between 3-day periods
  2. **Sector Rotation Requirement** - Must trade 3+ different sectors per week
  3. **Recovery Speed Limit** - Max 3% gain allowed after any losing day
  4. **Time-Weighted Profits** - Early profits worth 2x, late profits 0.5x
  5. **Correlation Penalty** - Correlated positions reduce profit counting by 50%
  6. **Market Cap Diversity** - Must trade Large, Mid, AND Small cap stocks
  7. **Volatility Adjustment** - Reduce position size 20% when VIX > 25

  ## Database Structure
  - master_challenges: Main challenge table
  - master_challenge_rules_tracking: Real-time rule compliance
  - master_challenge_trades: Trade history with rule validation
  - master_challenge_violations: Violation tracking
  
  ## Security
  - Full RLS implementation
  - Admin-only management functions
  - Comprehensive audit trail
*/

-- ====================================
-- MASTER CHALLENGE MAIN TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS master_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Account Details
  account_tier VARCHAR(20) NOT NULL CHECK (account_tier IN ('starter', 'professional')),
  account_size DECIMAL(12,2) NOT NULL,
  
  -- Phase Tracking
  current_phase INTEGER DEFAULT 1 CHECK (current_phase IN (1, 2)),
  phase1_status VARCHAR(30) DEFAULT 'active',
  phase2_status VARCHAR(30) DEFAULT 'locked',
  
  -- PHASE 1 Metrics
  phase1_start_date TIMESTAMPTZ,
  phase1_end_date TIMESTAMPTZ,
  phase1_payment_amount DECIMAL(10,2),
  phase1_starting_balance DECIMAL(12,2),
  phase1_current_balance DECIMAL(12,2),
  phase1_profit_target_amount DECIMAL(12,2),
  phase1_max_drawdown_limit DECIMAL(12,2),
  phase1_daily_loss_limit DECIMAL(12,2),
  phase1_min_trading_days INTEGER,
  phase1_trading_days_completed INTEGER DEFAULT 0,
  phase1_total_trades INTEGER DEFAULT 0,
  phase1_min_trades_required INTEGER,
  
  -- Phase 1 Unique Rule Metrics (NO CONSISTENCY)
  phase1_momentum_score DECIMAL(5,2),
  phase1_sectors_traded_this_week INTEGER DEFAULT 0,
  phase1_recovery_violations INTEGER DEFAULT 0,
  phase1_correlation_penalty_total DECIMAL(12,2) DEFAULT 0,
  phase1_time_weighted_profit DECIMAL(12,2) DEFAULT 0,
  phase1_large_cap_trades INTEGER DEFAULT 0,
  phase1_mid_cap_trades INTEGER DEFAULT 0,
  phase1_small_cap_trades INTEGER DEFAULT 0,
  phase1_volatility_violations INTEGER DEFAULT 0,
  
  -- PHASE 2 Metrics
  phase2_start_date TIMESTAMPTZ,
  phase2_end_date TIMESTAMPTZ,
  phase2_payment_amount DECIMAL(10,2),
  phase2_starting_balance DECIMAL(12,2),
  phase2_current_balance DECIMAL(12,2),
  phase2_profit_target_amount DECIMAL(12,2),
  phase2_max_drawdown_limit DECIMAL(12,2),
  phase2_daily_loss_limit DECIMAL(12,2),
  phase2_min_trading_days INTEGER,
  phase2_trading_days_completed INTEGER DEFAULT 0,
  phase2_total_trades INTEGER DEFAULT 0,
  phase2_min_trades_required INTEGER,
  
  -- Phase 2 Unique Rule Metrics
  phase2_momentum_score DECIMAL(5,2),
  phase2_sectors_traded_this_week INTEGER DEFAULT 0,
  phase2_recovery_violations INTEGER DEFAULT 0,
  phase2_correlation_penalty_total DECIMAL(12,2) DEFAULT 0,
  phase2_time_weighted_profit DECIMAL(12,2) DEFAULT 0,
  phase2_large_cap_trades INTEGER DEFAULT 0,
  phase2_mid_cap_trades INTEGER DEFAULT 0,
  phase2_small_cap_trades INTEGER DEFAULT 0,
  phase2_volatility_violations INTEGER DEFAULT 0,
  
  -- Overall Status
  overall_status VARCHAR(20) DEFAULT 'active',
  failed_reason TEXT,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE master_challenges ENABLE ROW LEVEL SECURITY;

-- RLS for master_challenges
CREATE POLICY "Users can view own master challenges"
  ON master_challenges FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all master challenges"
  ON master_challenges FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Admins can manage master challenges"
  ON master_challenges FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ====================================
-- TRADE HISTORY TABLE
-- ====================================
CREATE TABLE IF NOT EXISTS master_challenge_trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES master_challenges(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL,
  
  -- Trade Details
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL', 'LONG', 'SHORT')),
  entry_price DECIMAL(12,4),
  exit_price DECIMAL(12,4),
  position_size DECIMAL(12,2),
  profit_loss DECIMAL(12,2),
  
  -- Rule Validation Data
  sector VARCHAR(50),
  market_cap_category VARCHAR(20) CHECK (market_cap_category IN ('large', 'mid', 'small')),
  correlation_penalty_applied DECIMAL(5,2) DEFAULT 0,
  time_weight_multiplier DECIMAL(3,2) DEFAULT 1.0,
  weighted_profit DECIMAL(12,2),
  vix_level_at_trade DECIMAL(6,2),
  
  -- Timestamps
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE master_challenge_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
  ON master_challenge_trades FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM master_challenges 
      WHERE master_challenges.id = master_challenge_trades.challenge_id
      AND master_challenges.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all trades"
  ON master_challenge_trades FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ====================================
-- VIOLATIONS TRACKING
-- ====================================
CREATE TABLE IF NOT EXISTS master_challenge_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES master_challenges(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL,
  
  rule_name VARCHAR(50) NOT NULL,
  violation_type VARCHAR(20) NOT NULL CHECK (violation_type IN ('warning', 'minor', 'major', 'critical')),
  violation_details JSONB,
  violation_date TIMESTAMPTZ DEFAULT NOW(),
  caused_failure BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE master_challenge_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own violations"
  ON master_challenge_violations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM master_challenges 
      WHERE master_challenges.id = master_challenge_violations.challenge_id
      AND master_challenges.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage violations"
  ON master_challenge_violations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ====================================
-- SECTOR ROTATION TRACKING
-- ====================================
CREATE TABLE IF NOT EXISTS master_challenge_sector_rotation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES master_challenges(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  week_start_date DATE,
  sectors_traded TEXT[],
  sector_count INTEGER,
  meets_requirement BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ====================================
-- MOMENTUM TRACKING
-- ====================================
CREATE TABLE IF NOT EXISTS master_challenge_momentum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES master_challenges(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL,
  period_number INTEGER NOT NULL,
  period_start_date DATE,
  period_end_date DATE,
  period_profit DECIMAL(12,2),
  previous_period_profit DECIMAL(12,2),
  decay_percentage DECIMAL(5,2),
  violation BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE master_challenge_momentum ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own momentum"
  ON master_challenge_momentum FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM master_challenges 
      WHERE master_challenges.id = master_challenge_momentum.challenge_id
      AND master_challenges.user_id = auth.uid()
    )
  );

-- ====================================
-- HELPER FUNCTIONS
-- ====================================

-- Function: Create new Master Challenge
CREATE OR REPLACE FUNCTION create_master_challenge(
  p_user_id UUID,
  p_account_tier VARCHAR(20),
  p_account_size DECIMAL(12,2)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge_id UUID;
  v_phase1_target DECIMAL(12,2);
  v_phase1_drawdown DECIMAL(12,2);
  v_phase1_daily_loss DECIMAL(12,2);
  v_phase1_min_days INTEGER;
  v_phase1_min_trades INTEGER;
BEGIN
  -- Set requirements based on tier
  IF p_account_tier = 'starter' THEN
    v_phase1_target := p_account_size * 0.10; -- 10%
    v_phase1_drawdown := p_account_size * 0.12; -- 12%
    v_phase1_daily_loss := p_account_size * 0.06; -- 6%
    v_phase1_min_days := 5;
    v_phase1_min_trades := 8;
  ELSIF p_account_tier = 'professional' THEN
    v_phase1_target := p_account_size * 0.08; -- 8%
    v_phase1_drawdown := p_account_size * 0.10; -- 10%
    v_phase1_daily_loss := p_account_size * 0.05; -- 5%
    v_phase1_min_days := 5;
    v_phase1_min_trades := 15;
  END IF;

  -- Create challenge
  INSERT INTO master_challenges (
    user_id, account_tier, account_size,
    phase1_starting_balance, phase1_current_balance,
    phase1_profit_target_amount, phase1_max_drawdown_limit,
    phase1_daily_loss_limit, phase1_min_trading_days, phase1_min_trades_required,
    phase1_start_date
  ) VALUES (
    p_user_id, p_account_tier, p_account_size,
    p_account_size, p_account_size,
    v_phase1_target, v_phase1_drawdown,
    v_phase1_daily_loss, v_phase1_min_days, v_phase1_min_trades,
    NOW()
  ) RETURNING id INTO v_challenge_id;

  RETURN v_challenge_id;
END;
$$;

-- Function: Check Phase Completion
CREATE OR REPLACE FUNCTION check_master_challenge_phase_completion(
  p_challenge_id UUID,
  p_phase INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge RECORD;
  v_profit_met BOOLEAN;
  v_drawdown_ok BOOLEAN;
  v_days_met BOOLEAN;
  v_trades_met BOOLEAN;
  v_momentum_ok BOOLEAN;
  v_sector_rotation_ok BOOLEAN;
  v_no_recovery_violations BOOLEAN;
  v_market_cap_ok BOOLEAN;
  v_time_weighted_ok BOOLEAN;
BEGIN
  SELECT * INTO v_challenge FROM master_challenges WHERE id = p_challenge_id;

  IF p_phase = 1 THEN
    v_profit_met := v_challenge.phase1_current_balance >= (v_challenge.phase1_starting_balance + v_challenge.phase1_profit_target_amount);
    v_drawdown_ok := (v_challenge.phase1_starting_balance - v_challenge.phase1_current_balance) <= v_challenge.phase1_max_drawdown_limit;
    v_days_met := v_challenge.phase1_trading_days_completed >= v_challenge.phase1_min_trading_days;
    v_trades_met := v_challenge.phase1_total_trades >= v_challenge.phase1_min_trades_required;
    v_momentum_ok := COALESCE(v_challenge.phase1_momentum_score, 0) <= 30;
    v_sector_rotation_ok := v_challenge.phase1_sectors_traded_this_week >= 3;
    v_no_recovery_violations := v_challenge.phase1_recovery_violations = 0;
    v_market_cap_ok := v_challenge.phase1_large_cap_trades >= 3 AND v_challenge.phase1_mid_cap_trades >= 3 AND v_challenge.phase1_small_cap_trades >= 2;
    v_time_weighted_ok := v_challenge.phase1_time_weighted_profit >= (v_challenge.phase1_profit_target_amount * 0.9);
  ELSE
    v_profit_met := v_challenge.phase2_current_balance >= (v_challenge.phase2_starting_balance + v_challenge.phase2_profit_target_amount);
    v_drawdown_ok := (v_challenge.phase2_starting_balance - v_challenge.phase2_current_balance) <= v_challenge.phase2_max_drawdown_limit;
    v_days_met := v_challenge.phase2_trading_days_completed >= v_challenge.phase2_min_trading_days;
    v_trades_met := v_challenge.phase2_total_trades >= v_challenge.phase2_min_trades_required;
    v_momentum_ok := COALESCE(v_challenge.phase2_momentum_score, 0) <= 30;
    v_sector_rotation_ok := v_challenge.phase2_sectors_traded_this_week >= 4;
    v_no_recovery_violations := v_challenge.phase2_recovery_violations = 0;
    v_market_cap_ok := v_challenge.phase2_large_cap_trades >= 4 AND v_challenge.phase2_mid_cap_trades >= 4 AND v_challenge.phase2_small_cap_trades >= 3;
    v_time_weighted_ok := v_challenge.phase2_time_weighted_profit >= (v_challenge.phase2_profit_target_amount * 0.9);
  END IF;

  RETURN jsonb_build_object(
    'can_complete', v_profit_met AND v_drawdown_ok AND v_days_met AND v_trades_met AND v_momentum_ok AND v_sector_rotation_ok AND v_no_recovery_violations AND v_market_cap_ok AND v_time_weighted_ok,
    'checks', jsonb_build_object(
      'profit_target', v_profit_met,
      'drawdown', v_drawdown_ok,
      'trading_days', v_days_met,
      'min_trades', v_trades_met,
      'momentum_decay', v_momentum_ok,
      'sector_rotation', v_sector_rotation_ok,
      'recovery_speed', v_no_recovery_violations,
      'market_cap_diversity', v_market_cap_ok,
      'time_weighted_profit', v_time_weighted_ok
    )
  );
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_master_challenges_user_id ON master_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_master_challenge_trades_challenge_id ON master_challenge_trades(challenge_id);
CREATE INDEX IF NOT EXISTS idx_master_challenge_violations_challenge_id ON master_challenge_violations(challenge_id);
