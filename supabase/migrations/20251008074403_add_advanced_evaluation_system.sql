/*
  # Advanced Professional Evaluation System
  
  1. New Tables
    - challenge_types: Different evaluation paths (Standard, Rapid, Scaling, Professional, Swing)
    - consistency_scores: Professional trading metrics and scoring
    - trade_analytics: Advanced analysis of each trade
    - daily_performance: Daily trading statistics
    - advanced_metrics_cache: Real-time performance metrics
    
  2. Changes
    - Add challenge_type_id to challenges table
    - Add consistency score fields to challenges
    
  3. Security
    - Enable RLS on all new tables
    - Policies for authenticated users to access their own data
*/

-- Challenge Types Table
CREATE TABLE IF NOT EXISTS challenge_types (
    type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    marketing_tagline VARCHAR(255),
    
    -- Phase configuration
    number_of_phases INTEGER DEFAULT 2,
    
    -- Basic Rules (Phase 1)
    phase1_profit_target DECIMAL(5,2) NOT NULL,
    phase1_max_drawdown DECIMAL(5,2) NOT NULL,
    phase1_daily_loss_limit DECIMAL(5,2) NOT NULL,
    phase1_min_trading_days INTEGER DEFAULT 5,
    phase1_time_limit_days INTEGER,
    
    -- Basic Rules (Phase 2)
    phase2_profit_target DECIMAL(5,2),
    phase2_max_drawdown DECIMAL(5,2),
    phase2_daily_loss_limit DECIMAL(5,2),
    phase2_min_trading_days INTEGER,
    phase2_time_limit_days INTEGER,
    
    -- Advanced Requirements (Professional Metrics)
    requires_consistency_score BOOLEAN DEFAULT TRUE,
    min_consistency_score DECIMAL(4,2) DEFAULT 7.5,
    min_sharpe_ratio DECIMAL(10,4),
    min_profit_factor DECIMAL(10,4),
    min_risk_reward_ratio DECIMAL(10,4) DEFAULT 1.5,
    optimal_win_rate_min DECIMAL(5,2) DEFAULT 45,
    optimal_win_rate_max DECIMAL(5,2) DEFAULT 65,
    
    -- Trading Behavior Limits
    max_trades_per_day INTEGER DEFAULT 10,
    min_avg_trade_duration_hours DECIMAL(10,2),
    max_position_size_increase_percent DECIMAL(5,2) DEFAULT 30,
    max_correlated_positions INTEGER DEFAULT 3,
    requires_stop_loss BOOLEAN DEFAULT TRUE,
    min_stop_loss_pips INTEGER DEFAULT 10,
    max_stop_loss_pips INTEGER DEFAULT 250,
    
    -- Pricing
    challenge_fee DECIMAL(10,2) NOT NULL,
    reset_fee_discount_percent DECIMAL(5,2) DEFAULT 50,
    profit_split_trader_percent DECIMAL(5,2) NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE challenge_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenge types are publicly viewable"
  ON challenge_types FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Insert Challenge Types
INSERT INTO challenge_types (
    type_name, display_name, marketing_tagline,
    phase1_profit_target, phase1_max_drawdown, phase1_daily_loss_limit, phase1_min_trading_days,
    phase2_profit_target, phase2_max_drawdown, phase2_daily_loss_limit, phase2_min_trading_days,
    challenge_fee, profit_split_trader_percent, sort_order
) VALUES
(
    'standard', 
    'Standard Challenge', 
    '⭐ Most Popular - Classic 2-Phase Evaluation',
    8.00, 6.00, 3.00, 5,
    5.00, 6.00, 3.00, 5,
    79.00, 80.00, 1
),
(
    'rapid', 
    'Rapid Challenge', 
    '⚡ Get Funded in 10 Days - Single Phase',
    10.00, 6.00, 3.00, 5,
    NULL, NULL, NULL, NULL,
    149.00, 90.00, 2
),
(
    'scaling', 
    'Scaling Challenge', 
    '📈 Start Small, Scale to $500K',
    6.00, 6.00, 3.00, 5,
    6.00, 6.00, 3.00, 5,
    49.00, 95.00, 3
),
(
    'professional', 
    'Professional Challenge', 
    '👔 One Phase, 12% Target, Transparent Metrics',
    12.00, 8.00, 4.00, 10,
    NULL, NULL, NULL, NULL,
    299.00, 95.00, 4
),
(
    'swing', 
    'Swing Trader Challenge', 
    '📊 For Position Traders - 60 Days',
    15.00, 10.00, 5.00, 10,
    10.00, 10.00, 5.00, 10,
    349.00, 90.00, 5
);

-- Update single-phase challenges
UPDATE challenge_types 
SET number_of_phases = 1, phase1_time_limit_days = 10 
WHERE type_name = 'rapid';

UPDATE challenge_types 
SET phase1_time_limit_days = 60, phase2_time_limit_days = 60 
WHERE type_name = 'swing';

UPDATE challenge_types 
SET number_of_phases = 1 
WHERE type_name = 'professional';

-- Consistency Scores Table
CREATE TABLE IF NOT EXISTS consistency_scores (
    score_id SERIAL PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Overall Score
    final_score DECIMAL(4,2) NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    passing_threshold DECIMAL(4,2) DEFAULT 7.5,
    
    -- Component Scores (each out of 10)
    win_rate_score DECIMAL(4,2) DEFAULT 0,
    risk_reward_score DECIMAL(4,2) DEFAULT 0,
    equity_curve_score DECIMAL(4,2) DEFAULT 0,
    position_sizing_score DECIMAL(4,2) DEFAULT 0,
    emotional_control_score DECIMAL(4,2) DEFAULT 0,
    drawdown_recovery_score DECIMAL(4,2) DEFAULT 0,
    
    -- Supporting Metrics
    actual_win_rate DECIMAL(5,2),
    actual_rr_ratio DECIMAL(10,4),
    equity_curve_r_squared DECIMAL(10,4),
    sharpe_ratio DECIMAL(10,4),
    profit_factor DECIMAL(10,4),
    recovery_factor DECIMAL(10,4),
    
    -- Behavioral Metrics
    revenge_trade_count INTEGER DEFAULT 0,
    overtrading_incidents INTEGER DEFAULT 0,
    position_size_violations INTEGER DEFAULT 0,
    correlation_violations INTEGER DEFAULT 0,
    
    -- Trade Statistics
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    avg_win DECIMAL(15,2),
    avg_loss DECIMAL(15,2),
    largest_win DECIMAL(15,2),
    largest_loss DECIMAL(15,2),
    max_consecutive_wins INTEGER DEFAULT 0,
    max_consecutive_losses INTEGER DEFAULT 0,
    
    -- Feedback
    feedback_summary TEXT,
    improvement_suggestions TEXT[]
);

ALTER TABLE consistency_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consistency scores"
  ON consistency_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = consistency_scores.challenge_id
      AND challenges.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_consistency_challenge ON consistency_scores(challenge_id);
CREATE INDEX IF NOT EXISTS idx_consistency_passed ON consistency_scores(passed);

-- Trade Analytics Table
CREATE TABLE IF NOT EXISTS trade_analytics (
    analytics_id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    
    -- Risk Metrics
    risk_amount DECIMAL(15,2),
    risk_percentage DECIMAL(5,2),
    reward_amount DECIMAL(15,2),
    risk_reward_ratio DECIMAL(10,4),
    position_size_percent DECIMAL(5,2),
    
    -- Timing Analysis
    hold_duration_minutes INTEGER,
    time_since_last_trade_minutes INTEGER,
    trade_time_of_day VARCHAR(20),
    day_of_week VARCHAR(20),
    
    -- Context Flags
    during_major_news BOOLEAN DEFAULT FALSE,
    market_session VARCHAR(50),
    
    -- Behavioral Flags
    is_revenge_trade BOOLEAN DEFAULT FALSE,
    is_oversize_trade BOOLEAN DEFAULT FALSE,
    is_correlated_with_open BOOLEAN DEFAULT FALSE,
    
    -- Position Sizing Analysis
    lot_size_vs_avg_percent DECIMAL(10,2),
    lot_size_vs_previous_percent DECIMAL(10,2),
    
    -- Stop Loss Analysis
    stop_loss_distance_pips DECIMAL(10,2),
    take_profit_distance_pips DECIMAL(10,2),
    
    -- Warnings
    warnings_issued TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trade_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trade analytics"
  ON trade_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = trade_analytics.challenge_id
      AND challenges.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_trade_analytics_order ON trade_analytics(order_id);
CREATE INDEX IF NOT EXISTS idx_trade_analytics_challenge ON trade_analytics(challenge_id);

-- Daily Performance Table
CREATE TABLE IF NOT EXISTS daily_performance (
    daily_id SERIAL PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Daily Statistics
    starting_balance DECIMAL(15,2),
    ending_balance DECIMAL(15,2),
    daily_profit_loss DECIMAL(15,2),
    daily_profit_loss_percent DECIMAL(5,2),
    
    -- Trading Activity
    trades_opened INTEGER DEFAULT 0,
    trades_closed INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    
    -- Quality Metrics
    daily_win_rate DECIMAL(5,2),
    daily_avg_rr DECIMAL(10,4),
    daily_profit_factor DECIMAL(10,4),
    
    -- Flags
    is_trading_day BOOLEAN DEFAULT FALSE,
    daily_loss_limit_breached BOOLEAN DEFAULT FALSE,
    overtrading_detected BOOLEAN DEFAULT FALSE,
    
    -- Contribution to Consistency
    consistency_contribution DECIMAL(4,2),
    
    UNIQUE(challenge_id, date)
);

ALTER TABLE daily_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily performance"
  ON daily_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = daily_performance.challenge_id
      AND challenges.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_daily_performance_challenge ON daily_performance(challenge_id);
CREATE INDEX IF NOT EXISTS idx_daily_performance_date ON daily_performance(date);

-- Advanced Metrics Cache Table
CREATE TABLE IF NOT EXISTS advanced_metrics_cache (
    cache_id SERIAL PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE UNIQUE,
    
    -- Real-time metrics
    current_consistency_score DECIMAL(4,2),
    current_sharpe_ratio DECIMAL(10,4),
    current_profit_factor DECIMAL(10,4),
    current_recovery_factor DECIMAL(10,4),
    current_win_rate DECIMAL(5,2),
    current_rr_ratio DECIMAL(10,4),
    
    -- Equity curve analysis
    equity_curve_r_squared DECIMAL(10,4),
    equity_curve_slope DECIMAL(10,4),
    
    -- Risk metrics
    max_drawdown_reached DECIMAL(5,2),
    avg_daily_volatility DECIMAL(10,4),
    var_95 DECIMAL(15,2),
    
    -- Behavioral scores
    emotional_control_score DECIMAL(4,2),
    discipline_score DECIMAL(4,2),
    
    -- Status
    on_track_to_pass BOOLEAN,
    estimated_pass_probability DECIMAL(5,2),
    
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE advanced_metrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own advanced metrics"
  ON advanced_metrics_cache FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = advanced_metrics_cache.challenge_id
      AND challenges.user_id = auth.uid()
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_advanced_metrics_challenge ON advanced_metrics_cache(challenge_id);

-- Update Challenges Table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'challenge_type_id'
  ) THEN
    ALTER TABLE challenges ADD COLUMN challenge_type_id INTEGER REFERENCES challenge_types(type_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'current_phase'
  ) THEN
    ALTER TABLE challenges ADD COLUMN current_phase INTEGER DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'consistency_score_latest'
  ) THEN
    ALTER TABLE challenges ADD COLUMN consistency_score_latest DECIMAL(4,2);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'sharpe_ratio_latest'
  ) THEN
    ALTER TABLE challenges ADD COLUMN sharpe_ratio_latest DECIMAL(10,4);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'passes_advanced_criteria'
  ) THEN
    ALTER TABLE challenges ADD COLUMN passes_advanced_criteria BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type_id);