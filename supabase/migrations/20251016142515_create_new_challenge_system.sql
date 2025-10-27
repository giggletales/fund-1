/*
  # Create New Challenge System

  1. New Tables
    - `challenge_types` - Store the 6 challenge definitions
    - `challenge_pricing` - Pricing tiers for each challenge and account size
    - `challenge_rules` - Complete rule configuration for each challenge
    - `user_challenges` - User purchases and challenge state
    - `trading_activity` - Log of all trades executed
    - `daily_stats` - Daily performance statistics
    - `validation_results` - Challenge validation outcomes
    - `retry_discounts` - Discount codes for retry attempts
  
  2. Security
    - Enable RLS on all tables
    - Users can only view their own data
    - Public can view challenge types and pricing
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS retry_discounts CASCADE;
DROP TABLE IF EXISTS validation_results CASCADE;
DROP TABLE IF EXISTS daily_stats CASCADE;
DROP TABLE IF EXISTS trading_activity CASCADE;
DROP TABLE IF EXISTS user_challenges CASCADE;
DROP TABLE IF EXISTS challenge_rules CASCADE;
DROP TABLE IF EXISTS challenge_pricing CASCADE;
DROP TABLE IF EXISTS challenge_types CASCADE;

-- Table 1: Challenge Definitions
CREATE TABLE challenge_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_code text UNIQUE NOT NULL,
  challenge_name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  recommended boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table 2: Challenge Pricing Tiers
CREATE TABLE challenge_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type_id uuid REFERENCES challenge_types(id) ON DELETE CASCADE,
  account_size integer NOT NULL,
  regular_price decimal(10,2) NOT NULL,
  discount_price decimal(10,2) NOT NULL,
  platform_cost decimal(10,2) NOT NULL,
  phase_1_price decimal(10,2),
  phase_2_price decimal(10,2),
  profit_target_pct decimal(5,2),
  profit_target_amount decimal(10,2),
  phase_1_target_pct decimal(5,2),
  phase_2_target_pct decimal(5,2),
  phase_1_target_amount decimal(10,2),
  phase_2_target_amount decimal(10,2),
  daily_dd_pct decimal(5,2),
  max_dd_pct decimal(5,2),
  min_trading_days integer,
  time_limit_days integer
);

-- Table 3: Challenge Rules Configuration
CREATE TABLE challenge_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type_id uuid REFERENCES challenge_types(id) ON DELETE CASCADE,
  account_size integer,
  total_phases integer DEFAULT 1,
  phase_1_target_pct decimal(5,2),
  phase_2_target_pct decimal(5,2),
  phase_1_target_amount decimal(10,2),
  phase_2_target_amount decimal(10,2),
  daily_dd_pct decimal(5,2),
  max_dd_pct decimal(5,2),
  dd_calculation_type text DEFAULT 'peak_balance',
  includes_floating_pl boolean DEFAULT true,
  min_trading_days integer,
  time_limit_days integer,
  min_trades_per_day integer DEFAULT 2,
  min_instruments integer DEFAULT 2,
  consistency_rules jsonb DEFAULT '{"best_day_limit": 40, "min_profitable_days": 3, "min_win_rate": 35, "risk_reward_ratio": 1.2}'::jsonb,
  probability_filter jsonb DEFAULT '{"lot_size_spike": 1.5, "revenge_trade_count": 3, "sl_tp_chaos_threshold": 0.3, "martingale_detection": true}'::jsonb,
  activity_quality jsonb DEFAULT '{"min_trades_per_day": 2, "min_instruments": 2, "single_instrument_profit_limit": 80, "minimum_trade_duration": 30}'::jsonb,
  news_trading_rules jsonb DEFAULT '{"high_impact_buffer": 120, "excluded_from_profit": true, "max_news_profit_percentage": 30, "auto_detection": true}'::jsonb,
  weekend_rules jsonb DEFAULT '{"must_close_friday": true, "no_weekend_holds": true, "monday_gap_responsibility": false}'::jsonb
);

-- Table 4: User Purchases
CREATE TABLE user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  challenge_type_id uuid REFERENCES challenge_types(id),
  account_size integer,
  purchase_date timestamptz DEFAULT now(),
  amount_paid decimal(10,2),
  payment_id text,
  discount_applied boolean DEFAULT true,
  status text DEFAULT 'pending_payment',
  current_phase integer DEFAULT 1,
  phase_2_paid boolean DEFAULT false,
  phase_2_payment_date timestamptz,
  phase_2_amount decimal(10,2),
  start_date timestamptz,
  end_date timestamptz,
  trading_account_id text
);

-- Table 5: Trading Activity Log
CREATE TABLE trading_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_challenge_id uuid REFERENCES user_challenges(id) ON DELETE CASCADE,
  trade_id text,
  symbol text,
  trade_type text,
  lot_size decimal(10,4),
  open_price decimal(10,5),
  close_price decimal(10,5),
  open_time timestamptz,
  close_time timestamptz,
  profit_loss decimal(10,2),
  commission decimal(10,2),
  swap decimal(10,2),
  net_profit decimal(10,2),
  is_news_trade boolean DEFAULT false,
  is_revenge_trade boolean DEFAULT false,
  is_valid boolean DEFAULT true
);

-- Table 6: Daily Statistics
CREATE TABLE daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_challenge_id uuid REFERENCES user_challenges(id) ON DELETE CASCADE,
  trading_date date,
  starting_balance decimal(10,2),
  ending_balance decimal(10,2),
  peak_balance decimal(10,2),
  lowest_balance decimal(10,2),
  total_trades integer DEFAULT 0,
  winning_trades integer DEFAULT 0,
  losing_trades integer DEFAULT 0,
  instruments_traded integer DEFAULT 0,
  daily_profit_loss decimal(10,2),
  daily_dd_pct decimal(5,2),
  daily_dd_amount decimal(10,2),
  is_valid_trading_day boolean DEFAULT false,
  qualifies_for_min_days boolean DEFAULT false,
  UNIQUE(user_challenge_id, trading_date)
);

-- Table 7: Challenge Validation Results
CREATE TABLE validation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_challenge_id uuid REFERENCES user_challenges(id) ON DELETE CASCADE,
  validation_date timestamptz DEFAULT now(),
  passed boolean,
  failed boolean,
  failure_reason text,
  profit_target_met boolean,
  daily_dd_violated boolean,
  max_dd_violated boolean,
  min_days_met boolean,
  time_limit_met boolean,
  consistency_check_passed boolean,
  consistency_check_details jsonb,
  probability_check_passed boolean,
  probability_check_details jsonb,
  activity_quality_passed boolean,
  activity_quality_details jsonb,
  news_trading_passed boolean,
  news_trading_details jsonb,
  action_taken text,
  notification_sent boolean DEFAULT false
);

-- Table 8: Retry/Discount Tracking
CREATE TABLE retry_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  original_challenge_id uuid REFERENCES user_challenges(id),
  discount_code text UNIQUE,
  discount_percentage integer,
  reason text,
  issued_date timestamptz DEFAULT now(),
  expiry_date timestamptz,
  used boolean DEFAULT false,
  used_date timestamptz,
  new_challenge_id uuid
);

-- Add indexes
CREATE INDEX idx_challenge_pricing_type ON challenge_pricing(challenge_type_id);
CREATE INDEX idx_challenge_rules_type ON challenge_rules(challenge_type_id);
CREATE INDEX idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_status ON user_challenges(status);
CREATE INDEX idx_trading_activity_challenge ON trading_activity(user_challenge_id);
CREATE INDEX idx_daily_stats_challenge ON daily_stats(user_challenge_id);
CREATE INDEX idx_validation_results_challenge ON validation_results(user_challenge_id);
CREATE INDEX idx_retry_discounts_user ON retry_discounts(user_id);

-- Enable RLS
ALTER TABLE challenge_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE retry_discounts ENABLE ROW LEVEL SECURITY;

-- Public access to challenge types and pricing
CREATE POLICY "Anyone can view challenge types"
  ON challenge_types FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Anyone can view pricing"
  ON challenge_pricing FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view rules"
  ON challenge_rules FOR SELECT
  TO public
  USING (true);

-- User-specific policies
CREATE POLICY "Users can view their own challenges"
  ON user_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create challenges"
  ON user_challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their challenges"
  ON user_challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their trading activity"
  ON trading_activity FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_challenges
      WHERE user_challenges.id = trading_activity.user_challenge_id
      AND user_challenges.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their daily stats"
  ON daily_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_challenges
      WHERE user_challenges.id = daily_stats.user_challenge_id
      AND user_challenges.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their validation results"
  ON validation_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_challenges
      WHERE user_challenges.id = validation_results.user_challenge_id
      AND user_challenges.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their retry discounts"
  ON retry_discounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);