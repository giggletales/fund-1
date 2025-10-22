-- Create challenge_types reference table
CREATE TABLE IF NOT EXISTS challenge_types (
    type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    tagline VARCHAR(200),
    description TEXT,
    phases INTEGER NOT NULL,
    phase1_profit_target DECIMAL(5,2) NOT NULL,
    phase2_profit_target DECIMAL(5,2),
    max_drawdown DECIMAL(5,2) NOT NULL,
    daily_loss_limit DECIMAL(5,2) NOT NULL,
    min_trading_days INTEGER NOT NULL,
    time_limit_days INTEGER,
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

CREATE TABLE IF NOT EXISTS pricing_matrix (
    pricing_id SERIAL PRIMARY KEY,
    account_size DECIMAL(15,2) NOT NULL,
    challenge_type VARCHAR(50) NOT NULL,
    challenge_fee DECIMAL(10,2) NOT NULL,
    reset_discount_percent DECIMAL(5,2) DEFAULT 50,
    profit_split_percent DECIMAL(5,2) NOT NULL,
    max_lot_size DECIMAL(10,2) NOT NULL,
    max_positions INTEGER DEFAULT 10,
    features TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_size, challenge_type)
);

ALTER TABLE challenge_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenge types" ON challenge_types FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view pricing" ON pricing_matrix FOR SELECT TO public USING (is_active = true);