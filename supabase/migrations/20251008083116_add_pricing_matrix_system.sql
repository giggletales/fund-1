/*
  # Add Complete Pricing Matrix System

  1. New Tables
    - `challenge_types` - Reference table for all challenge type configurations
    - `pricing_matrix` - Pricing for all account size × challenge type combinations
    - `consistency_scores` - Detailed consistency scoring for challenges

  2. Changes
    - Update `challenges` table with new columns for challenge types and consistency
    - Add all 5 challenge types (Standard, Rapid, Scaling, Professional, Swing)
    - Add pricing for all 30 combinations (6 sizes × 5 types)

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated access
*/

-- Create challenge_types reference table
CREATE TABLE IF NOT EXISTS challenge_types (
    type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    tagline VARCHAR(200),
    description TEXT,

    -- Evaluation Rules
    phases INTEGER NOT NULL,
    phase1_profit_target DECIMAL(5,2) NOT NULL,
    phase2_profit_target DECIMAL(5,2),
    max_drawdown DECIMAL(5,2) NOT NULL,
    daily_loss_limit DECIMAL(5,2) NOT NULL,
    min_trading_days INTEGER NOT NULL,
    time_limit_days INTEGER,

    -- Advanced Requirements (The Hidden Complexity)
    consistency_score_required DECIMAL(3,1) NOT NULL DEFAULT 7.5,
    min_sharpe_ratio DECIMAL(5,2),
    min_profit_factor DECIMAL(5,2),
    min_risk_reward_ratio DECIMAL(5,2),
    optimal_win_rate_min DECIMAL(5,2),
    optimal_win_rate_max DECIMAL(5,2),
    max_trades_per_day INTEGER,
    max_position_size_jump DECIMAL(5,2),
    requires_stop_loss BOOLEAN DEFAULT TRUE,
    min_stop_loss_pips INTEGER,
    max_stop_loss_pips INTEGER,

    difficulty VARCHAR(20),
    badge VARCHAR(50),
    recommended BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pricing matrix table
CREATE TABLE IF NOT EXISTS pricing_matrix (
    pricing_id SERIAL PRIMARY KEY,
    account_size DECIMAL(15,2) NOT NULL,
    challenge_type VARCHAR(50) NOT NULL,

    -- Pricing
    challenge_fee DECIMAL(10,2) NOT NULL,
    reset_discount_percent DECIMAL(5,2) DEFAULT 50,
    profit_split_percent DECIMAL(5,2) NOT NULL,

    -- Account Limits
    max_lot_size DECIMAL(10,2) NOT NULL,
    max_positions INTEGER DEFAULT 10,

    -- Features
    features TEXT[],

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(account_size, challenge_type)
);

-- Update challenges table with new columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'challenges' AND column_name = 'challenge_type') THEN
        ALTER TABLE challenges ADD COLUMN challenge_type VARCHAR(50) DEFAULT 'standard';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'challenges' AND column_name = 'consistency_score_current') THEN
        ALTER TABLE challenges ADD COLUMN consistency_score_current DECIMAL(3,1);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'challenges' AND column_name = 'consistency_score_required') THEN
        ALTER TABLE challenges ADD COLUMN consistency_score_required DECIMAL(3,1) DEFAULT 7.5;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'challenges' AND column_name = 'consistency_passed') THEN
        ALTER TABLE challenges ADD COLUMN consistency_passed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create consistency_scores table
CREATE TABLE IF NOT EXISTS consistency_scores (
    score_id SERIAL PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES challenges(challenge_id) ON DELETE CASCADE,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Overall Score
    final_score DECIMAL(3,1) NOT NULL,
    passed BOOLEAN NOT NULL,

    -- Component Scores (out of 10)
    win_rate_score DECIMAL(3,1),
    risk_reward_score DECIMAL(3,1),
    equity_curve_score DECIMAL(3,1),
    position_sizing_score DECIMAL(3,1),
    emotional_control_score DECIMAL(3,1),
    drawdown_recovery_score DECIMAL(3,1),

    -- Supporting Metrics
    actual_win_rate DECIMAL(5,2),
    actual_rr_ratio DECIMAL(10,4),
    sharpe_ratio DECIMAL(10,4),
    profit_factor DECIMAL(10,4),
    equity_r_squared DECIMAL(5,4),

    -- Behavioral Flags
    revenge_trade_count INTEGER DEFAULT 0,
    overtrading_count INTEGER DEFAULT 0,

    -- Feedback
    feedback TEXT,
    suggestions TEXT[]
);

-- Insert challenge types
INSERT INTO challenge_types (
    type_name, display_name, tagline, description,
    phases, phase1_profit_target, phase2_profit_target,
    max_drawdown, daily_loss_limit, min_trading_days, time_limit_days,
    consistency_score_required, min_sharpe_ratio, min_profit_factor, min_risk_reward_ratio,
    optimal_win_rate_min, optimal_win_rate_max,
    max_trades_per_day, max_position_size_jump,
    min_stop_loss_pips, max_stop_loss_pips,
    difficulty, badge, recommended, sort_order
) VALUES
('standard', 'Standard Challenge', 'Most Popular - Classic 2-Phase',
 'Our classic evaluation process. Pass two phases and get funded. Perfect for most traders.',
 2, 8.00, 5.00, 6.00, 3.00, 5, NULL,
 7.5, 1.2, 1.5, 1.8, 45, 65, 10, 30, 10, 200,
 'Intermediate', 'MOST POPULAR', true, 1),

('rapid', 'Rapid Challenge', 'Get Funded in 10 Days',
 'Fast-track to funding. One phase, 10 days. For experienced traders who want quick results.',
 1, 10.00, NULL, 6.00, 3.00, 5, 10,
 8.0, 1.5, 2.0, 2.0, 50, 65, 8, 25, 15, 150,
 'Advanced', 'FAST TRACK', false, 2),

('scaling', 'Scaling Challenge', 'Start Small, Scale to $2M',
 'Lower targets, but prove consistency to scale up. Grow from $10K to $2M over time.',
 2, 6.00, 6.00, 6.00, 3.00, 5, NULL,
 8.0, 1.4, 1.8, 1.8, 45, 65, 12, 20, 10, 200,
 'Intermediate', 'BEST VALUE', false, 3),

('professional', 'Professional Challenge', 'One Phase, Full Transparency',
 'All advanced metrics visible upfront. Single 12% target. For serious professionals.',
 1, 12.00, NULL, 8.00, 4.00, 10, NULL,
 7.5, 1.3, 1.8, 2.0, 45, 70, 15, 35, 15, 250,
 'Professional', 'PRO LEVEL', false, 4),

('swing', 'Swing Trader Challenge', 'For Position Traders',
 'Designed for swing traders. Higher targets, wider stops, longer timeframes. 60-day evaluation.',
 2, 15.00, 10.00, 10.00, 5.00, 10, 60,
 7.5, 1.0, 2.0, 2.5, 40, 60, 5, 30, 30, 500,
 'Advanced', 'SWING TRADERS', false, 5)
ON CONFLICT (type_name) DO NOTHING;

-- Insert pricing matrix for all 30 combinations
INSERT INTO pricing_matrix (account_size, challenge_type, challenge_fee, profit_split_percent, max_lot_size, features) VALUES
-- $5,000 accounts
(5000, 'standard', 29, 80, 0.5, ARRAY['Perfect for beginners', 'Lower entry cost', 'Learn the process']),
(5000, 'rapid', 99, 85, 0.5, ARRAY['Fast-track evaluation', 'Skip Phase 2', '10-day time limit']),
(5000, 'scaling', 39, 90, 0.5, ARRAY['Lowest entry cost', 'Highest profit split', 'Scale to $2M']),
(5000, 'professional', 199, 90, 0.5, ARRAY['Professional standards', 'Full transparency', 'All metrics visible']),
(5000, 'swing', 249, 85, 0.5, ARRAY['Position trading', 'Wider stops', '60-day timeframe']),

-- $10,000 accounts
(10000, 'standard', 49, 80, 1.0, ARRAY['Most popular choice', 'Best value for money', 'Ideal starting point']),
(10000, 'rapid', 149, 85, 1.0, ARRAY['Fast-track evaluation', 'Skip Phase 2', '10-day time limit']),
(10000, 'scaling', 49, 90, 1.0, ARRAY['Great value', 'High profit split', 'Scale to $2M']),
(10000, 'professional', 299, 90, 1.0, ARRAY['Professional standards', 'Full transparency', 'All metrics visible']),
(10000, 'swing', 349, 85, 1.0, ARRAY['Position trading', 'Wider stops', '60-day timeframe']),

-- $25,000 accounts
(25000, 'standard', 99, 85, 2.5, ARRAY['Experienced traders', 'Higher profit split', 'Serious capital']),
(25000, 'rapid', 249, 90, 2.5, ARRAY['Fast-track evaluation', '90% profit split', '10-day time limit']),
(25000, 'scaling', 99, 95, 2.5, ARRAY['Excellent value', '95% profit split', 'Scale to $2M']),
(25000, 'professional', 499, 95, 2.5, ARRAY['Professional standards', '95% profit split', 'Full transparency']),
(25000, 'swing', 599, 90, 2.5, ARRAY['Position trading', '90% profit split', '60-day timeframe']),

-- $50,000 accounts
(50000, 'standard', 149, 85, 5.0, ARRAY['Professional level', 'Premium profit split', 'Priority support']),
(50000, 'rapid', 399, 90, 5.0, ARRAY['Fast-track evaluation', '90% profit split', 'Priority support']),
(50000, 'scaling', 149, 95, 5.0, ARRAY['Best value', '95% profit split', 'VIP treatment']),
(50000, 'professional', 799, 95, 5.0, ARRAY['Professional standards', '95% profit split', 'Dedicated support']),
(50000, 'swing', 899, 90, 5.0, ARRAY['Position trading', 'VIP support', '60-day timeframe']),

-- $100,000 accounts
(100000, 'standard', 249, 90, 10.0, ARRAY['Elite traders only', '90% profit split', 'VIP support', 'Dedicated account manager']),
(100000, 'rapid', 699, 90, 10.0, ARRAY['Fast-track elite', '90% profit split', 'VIP support', 'Priority processing']),
(100000, 'scaling', 249, 95, 10.0, ARRAY['Elite scaling', '95% profit split', 'VIP support', 'Scale to $2M']),
(100000, 'professional', 1299, 95, 10.0, ARRAY['Elite professional', '95% profit split', 'VIP support', 'Full transparency']),
(100000, 'swing', 1499, 90, 10.0, ARRAY['Elite swing', '90% profit split', 'VIP support', 'Extended timeframe']),

-- $200,000 accounts
(200000, 'standard', 449, 90, 20.0, ARRAY['Maximum capital', '90% profit split', 'Weekly payouts', 'Executive support', 'Private Telegram']),
(200000, 'rapid', 1199, 90, 20.0, ARRAY['Maximum capital', 'Fast-track', 'Weekly payouts', 'Executive support']),
(200000, 'scaling', 449, 95, 20.0, ARRAY['Maximum capital', '95% profit split', 'Weekly payouts', 'Scale to $2M']),
(200000, 'professional', 2199, 95, 20.0, ARRAY['Maximum capital', '95% profit split', 'Weekly payouts', 'Elite support']),
(200000, 'swing', 2499, 90, 20.0, ARRAY['Maximum capital', 'Position trading', 'Weekly payouts', 'Premium support'])
ON CONFLICT (account_size, challenge_type) DO NOTHING;

-- Enable RLS
ALTER TABLE challenge_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE consistency_scores ENABLE ROW LEVEL SECURITY;

-- Policies for challenge_types (public read)
CREATE POLICY "Anyone can view challenge types"
  ON challenge_types FOR SELECT
  TO public
  USING (is_active = true);

-- Policies for pricing_matrix (public read)
CREATE POLICY "Anyone can view pricing"
  ON pricing_matrix FOR SELECT
  TO public
  USING (is_active = true);

-- Policies for consistency_scores (authenticated users can view their own)
CREATE POLICY "Users can view own consistency scores"
  ON consistency_scores FOR SELECT
  TO authenticated
  USING (
    challenge_id IN (
      SELECT challenge_id FROM challenges
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert consistency scores"
  ON consistency_scores FOR INSERT
  TO authenticated
  WITH CHECK (
    challenge_id IN (
      SELECT challenge_id FROM challenges
      WHERE user_id = auth.uid()
    )
  );
