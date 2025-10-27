/*
  # Equities Challenge System - Complete Implementation

  1. New Tables
    - `equities_challenges` - Main challenge records with all metrics
    - `equities_trades` - Individual trade records with full details
    - `sector_exposure` - Daily sector allocation tracking
    - `pdt_tracker` - Pattern Day Trading compliance monitoring
    - `equities_consistency_metrics` - Detailed consistency calculations
    
  2. Challenge Tiers
    - Tier 1: $100,000 account, $199 price, 8% target, professional rules
    - Tier 2: $25,000 account, $99 price, 6% target, starter rules
    
  3. Key Features
    - Real-time rule violation tracking
    - Sector exposure limits (40%/50% depending on tier)
    - PDT compliance for Tier 2 accounts
    - Advanced consistency scoring (10-point scale)
    - Sharpe ratio and profit factor calculations
    - Position sizing limits (20%/30% per stock)
    
  4. Security
    - RLS enabled on all tables
    - Users can only access their own challenges
    - Admin functions for monitoring and management
*/

-- Main Equities Challenges Table
CREATE TABLE IF NOT EXISTS equities_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unique_user_id TEXT NOT NULL,
  
  -- Challenge Configuration
  tier INTEGER NOT NULL CHECK (tier IN (1, 2)),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'passed', 'failed', 'restricted', 'expired')),
  
  -- Account Details
  account_size DECIMAL(12,2) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL,
  starting_balance DECIMAL(12,2) NOT NULL,
  peak_balance DECIMAL(12,2) NOT NULL,
  
  -- Progress Tracking
  profit_amount DECIMAL(12,2) DEFAULT 0,
  profit_percentage DECIMAL(6,2) DEFAULT 0,
  current_drawdown DECIMAL(6,2) DEFAULT 0,
  max_drawdown_hit DECIMAL(6,2) DEFAULT 0,
  daily_loss_today DECIMAL(12,2) DEFAULT 0,
  
  -- Trading Days
  trading_days_count INTEGER DEFAULT 0,
  active_trading_dates JSONB DEFAULT '[]'::JSONB,
  
  -- Rule Violations
  daily_loss_violations INTEGER DEFAULT 0,
  position_size_violations INTEGER DEFAULT 0,
  pdt_violations INTEGER DEFAULT 0,
  sector_exposure_violations INTEGER DEFAULT 0,
  trading_hours_violations INTEGER DEFAULT 0,
  earnings_violations INTEGER DEFAULT 0,
  
  -- Advanced Metrics
  sharpe_ratio DECIMAL(6,2) DEFAULT 0,
  profit_factor DECIMAL(6,2) DEFAULT 0,
  win_rate DECIMAL(6,2) DEFAULT 0,
  avg_win DECIMAL(12,2) DEFAULT 0,
  avg_loss DECIMAL(12,2) DEFAULT 0,
  max_consecutive_wins INTEGER DEFAULT 0,
  max_consecutive_losses INTEGER DEFAULT 0,
  current_consecutive_losses INTEGER DEFAULT 0,
  
  -- Consistency Scoring (0-10 scale)
  consistency_score DECIMAL(3,1) DEFAULT 0,
  volume_consistency DECIMAL(3,1) DEFAULT 0,
  profit_consistency DECIMAL(3,1) DEFAULT 0,
  risk_consistency DECIMAL(3,1) DEFAULT 0,
  
  -- Position Tracking
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  open_positions JSONB DEFAULT '[]'::JSONB,
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  last_trade_at TIMESTAMPTZ,
  
  -- Results
  passed BOOLEAN DEFAULT FALSE,
  failure_reason TEXT,
  evaluation_notes TEXT,
  
  -- Payment
  payment_id UUID REFERENCES payments(id),
  challenge_fee DECIMAL(10,2) NOT NULL,
  
  CONSTRAINT valid_balance CHECK (current_balance >= 0),
  CONSTRAINT valid_tier CHECK (tier IN (1, 2)),
  CONSTRAINT valid_dates CHECK (expires_at > started_at)
);

-- Equities Trades Table
CREATE TABLE IF NOT EXISTS equities_trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES equities_challenges(id) ON DELETE CASCADE NOT NULL,
  
  -- Trade Identification
  symbol TEXT NOT NULL,
  company_name TEXT,
  sector TEXT,
  market_cap_category TEXT CHECK (market_cap_category IN ('large', 'mid', 'small', 'micro')),
  
  -- Trade Details
  trade_type TEXT NOT NULL CHECK (trade_type IN ('BUY', 'SELL', 'SHORT', 'COVER')),
  shares INTEGER NOT NULL CHECK (shares > 0),
  
  -- Pricing
  entry_price DECIMAL(12,4) NOT NULL CHECK (entry_price > 0),
  exit_price DECIMAL(12,4),
  stop_loss DECIMAL(12,4),
  take_profit DECIMAL(12,4),
  
  -- Position Metrics
  position_value DECIMAL(12,2) NOT NULL,
  position_size_percent DECIMAL(6,2) NOT NULL,
  profit_loss DECIMAL(12,2) DEFAULT 0,
  profit_loss_percent DECIMAL(6,2) DEFAULT 0,
  
  -- Risk Metrics
  risk_amount DECIMAL(12,2),
  risk_percent DECIMAL(6,2),
  risk_reward_ratio DECIMAL(6,2),
  
  -- Timing
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  hold_duration INTERVAL,
  is_day_trade BOOLEAN DEFAULT FALSE,
  is_pattern_day_trade BOOLEAN DEFAULT FALSE,
  
  -- Market Conditions
  volume_at_entry BIGINT,
  volatility_at_entry DECIMAL(6,2),
  price_change_percent DECIMAL(6,2),
  
  -- Special Flags
  earnings_trade BOOLEAN DEFAULT FALSE,
  gap_trade BOOLEAN DEFAULT FALSE,
  news_event_trade BOOLEAN DEFAULT FALSE,
  pre_market_trade BOOLEAN DEFAULT FALSE,
  after_hours_trade BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'stopped_out', 'target_hit')),
  
  CONSTRAINT valid_prices CHECK (entry_price > 0)
);

-- Sector Exposure Tracking
CREATE TABLE IF NOT EXISTS sector_exposure (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES equities_challenges(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Sector Percentages
  technology DECIMAL(6,2) DEFAULT 0,
  healthcare DECIMAL(6,2) DEFAULT 0,
  financial DECIMAL(6,2) DEFAULT 0,
  consumer_discretionary DECIMAL(6,2) DEFAULT 0,
  consumer_staples DECIMAL(6,2) DEFAULT 0,
  energy DECIMAL(6,2) DEFAULT 0,
  utilities DECIMAL(6,2) DEFAULT 0,
  industrials DECIMAL(6,2) DEFAULT 0,
  materials DECIMAL(6,2) DEFAULT 0,
  real_estate DECIMAL(6,2) DEFAULT 0,
  communication DECIMAL(6,2) DEFAULT 0,
  
  -- Summary Metrics
  max_sector_exposure DECIMAL(6,2) NOT NULL,
  diversification_score DECIMAL(3,1),
  number_of_sectors INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(challenge_id, date)
);

-- Pattern Day Trading Tracker
CREATE TABLE IF NOT EXISTS pdt_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES equities_challenges(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- PDT Metrics
  day_trades_today INTEGER DEFAULT 0,
  rolling_5day_count INTEGER DEFAULT 0,
  pdt_flag_triggered BOOLEAN DEFAULT FALSE,
  account_restricted BOOLEAN DEFAULT FALSE,
  
  -- Account Status
  account_equity DECIMAL(12,2),
  meets_25k_requirement BOOLEAN DEFAULT FALSE,
  
  -- Tracking
  day_trade_details JSONB DEFAULT '[]'::JSONB,
  restriction_lifted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(challenge_id, date)
);

-- Consistency Metrics Detail
CREATE TABLE IF NOT EXISTS equities_consistency_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES equities_challenges(id) ON DELETE CASCADE NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Volume Consistency (2 points max)
  avg_position_size DECIMAL(12,2),
  position_size_std_dev DECIMAL(12,2),
  volume_consistency_score DECIMAL(3,1),
  
  -- Profit Consistency (2 points max)
  profit_per_trade_avg DECIMAL(12,2),
  profit_std_dev DECIMAL(12,2),
  profit_consistency_score DECIMAL(3,1),
  
  -- Risk Consistency (2 points max)
  avg_risk_per_trade DECIMAL(12,2),
  risk_std_dev DECIMAL(12,2),
  risk_consistency_score DECIMAL(3,1),
  
  -- Win Rate Quality (1.5 points max)
  win_rate DECIMAL(6,2),
  win_rate_quality_score DECIMAL(3,1),
  
  -- Diversification (1.5 points max)
  unique_symbols_traded INTEGER,
  sector_diversification DECIMAL(3,1),
  diversification_score DECIMAL(3,1),
  
  -- Time Management (1 point max)
  avg_hold_time INTERVAL,
  time_management_score DECIMAL(3,1),
  
  -- Total Score
  total_consistency_score DECIMAL(3,1),
  
  UNIQUE(challenge_id, calculated_at)
);

-- Enable RLS on all tables
ALTER TABLE equities_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE equities_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_exposure ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdt_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE equities_consistency_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for equities_challenges
CREATE POLICY "Users can view their own equities challenges"
  ON equities_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own equities challenges"
  ON equities_challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equities challenges"
  ON equities_challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for equities_trades
CREATE POLICY "Users can view their own equities trades"
  ON equities_trades FOR SELECT
  TO authenticated
  USING (
    challenge_id IN (
      SELECT id FROM equities_challenges WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own equities trades"
  ON equities_trades FOR INSERT
  TO authenticated
  WITH CHECK (
    challenge_id IN (
      SELECT id FROM equities_challenges WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for sector_exposure
CREATE POLICY "Users can view their own sector exposure"
  ON sector_exposure FOR SELECT
  TO authenticated
  USING (
    challenge_id IN (
      SELECT id FROM equities_challenges WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for pdt_tracker
CREATE POLICY "Users can view their own PDT tracking"
  ON pdt_tracker FOR SELECT
  TO authenticated
  USING (
    challenge_id IN (
      SELECT id FROM equities_challenges WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for consistency metrics
CREATE POLICY "Users can view their own consistency metrics"
  ON equities_consistency_metrics FOR SELECT
  TO authenticated
  USING (
    challenge_id IN (
      SELECT id FROM equities_challenges WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_equities_challenges_user ON equities_challenges(user_id, status);
CREATE INDEX IF NOT EXISTS idx_equities_challenges_tier ON equities_challenges(tier, status);
CREATE INDEX IF NOT EXISTS idx_equities_trades_challenge ON equities_trades(challenge_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_equities_trades_symbol ON equities_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_equities_trades_status ON equities_trades(challenge_id, status);
CREATE INDEX IF NOT EXISTS idx_sector_exposure_challenge ON sector_exposure(challenge_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_pdt_tracker_challenge ON pdt_tracker(challenge_id, date DESC);

-- Function to create equities challenge from payment
CREATE OR REPLACE FUNCTION create_equities_challenge_from_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier INTEGER;
  v_account_size DECIMAL(12,2);
  v_duration_days INTEGER;
  v_unique_id TEXT;
BEGIN
  -- Only process equities challenge payments
  IF NEW.notes NOT LIKE '%Equities%' THEN
    RETURN NEW;
  END IF;

  -- Determine tier from amount
  IF NEW.amount >= 199 THEN
    v_tier := 1;
    v_account_size := 100000;
    v_duration_days := 45;
  ELSIF NEW.amount >= 99 THEN
    v_tier := 2;
    v_account_size := 25000;
    v_duration_days := 30;
  ELSE
    RETURN NEW;
  END IF;

  -- Generate unique user ID (5 digits)
  v_unique_id := 'EQ' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');

  -- Create equities challenge
  INSERT INTO equities_challenges (
    user_id,
    unique_user_id,
    tier,
    account_size,
    current_balance,
    starting_balance,
    peak_balance,
    expires_at,
    payment_id,
    challenge_fee
  ) VALUES (
    NEW.user_id,
    v_unique_id,
    v_tier,
    v_account_size,
    v_account_size,
    v_account_size,
    v_account_size,
    NOW() + (v_duration_days || ' days')::INTERVAL,
    NEW.id,
    NEW.amount
  );

  RETURN NEW;
END;
$$;

-- Create trigger for automatic challenge creation
DROP TRIGGER IF EXISTS trigger_create_equities_challenge ON payments;
CREATE TRIGGER trigger_create_equities_challenge
  AFTER INSERT ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.notes LIKE '%Equities%')
  EXECUTE FUNCTION create_equities_challenge_from_payment();

COMMENT ON TABLE equities_challenges IS 'Equities trading challenges - separate from Forex challenges';
COMMENT ON TABLE equities_trades IS 'Individual stock/ETF trades within equities challenges';
COMMENT ON TABLE sector_exposure IS 'Daily tracking of sector allocation to enforce diversification rules';
COMMENT ON TABLE pdt_tracker IS 'Pattern Day Trading rule compliance for accounts under $25k';
COMMENT ON TABLE equities_consistency_metrics IS 'Detailed consistency scoring calculations';
