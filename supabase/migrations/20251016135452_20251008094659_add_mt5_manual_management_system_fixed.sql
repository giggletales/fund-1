-- MT5 Manual Account Management System

-- User MT5 Accounts table
CREATE TABLE IF NOT EXISTS mt5_accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- MT5 Credentials
    mt5_login VARCHAR(50) NOT NULL,
    mt5_password TEXT NOT NULL,
    mt5_server VARCHAR(255) NOT NULL DEFAULT 'MetaQuotes-Demo',
    investor_password TEXT,
    
    -- Account Details
    account_type VARCHAR(50) NOT NULL,
    account_size DECIMAL(15,2) NOT NULL,
    initial_balance DECIMAL(15,2) NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    leverage INTEGER DEFAULT 100,
    
    -- Link to challenge
    challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    UNIQUE(mt5_login, mt5_server)
);

ALTER TABLE mt5_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MT5 accounts"
  ON mt5_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MT5 accounts"
  ON mt5_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own MT5 accounts"
  ON mt5_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trade History table
CREATE TABLE IF NOT EXISTS mt5_trades (
    trade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES mt5_accounts(account_id) ON DELETE CASCADE,
    
    -- Trade Details
    ticket_number VARCHAR(50),
    symbol VARCHAR(20) NOT NULL,
    trade_type VARCHAR(10) NOT NULL,
    volume DECIMAL(10,2) NOT NULL,
    
    -- Prices
    open_price DECIMAL(20,5) NOT NULL,
    close_price DECIMAL(20,5),
    stop_loss DECIMAL(20,5),
    take_profit DECIMAL(20,5),
    
    -- Timing
    open_time TIMESTAMPTZ NOT NULL,
    close_time TIMESTAMPTZ,
    
    -- Results
    profit_loss DECIMAL(15,2),
    commission DECIMAL(15,2) DEFAULT 0,
    swap DECIMAL(15,2) DEFAULT 0,
    net_profit DECIMAL(15,2),
    
    -- Balance Tracking
    balance_before DECIMAL(15,2),
    balance_after DECIMAL(15,2),
    
    -- Metadata
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mt5_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view trades for own MT5 accounts"
  ON mt5_trades FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mt5_accounts
      WHERE mt5_accounts.account_id = mt5_trades.account_id
      AND mt5_accounts.user_id = auth.uid()
    )
  );

-- Daily Equity Snapshots table
CREATE TABLE IF NOT EXISTS mt5_equity_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES mt5_accounts(account_id) ON DELETE CASCADE,
    
    -- Snapshot Data
    snapshot_date DATE NOT NULL,
    balance DECIMAL(15,2) NOT NULL,
    equity DECIMAL(15,2) NOT NULL,
    margin DECIMAL(15,2),
    free_margin DECIMAL(15,2),
    margin_level DECIMAL(10,2),
    
    -- Daily Stats
    daily_profit_loss DECIMAL(15,2),
    daily_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(account_id, snapshot_date)
);

ALTER TABLE mt5_equity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equity snapshots for own accounts"
  ON mt5_equity_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mt5_accounts
      WHERE mt5_accounts.account_id = mt5_equity_snapshots.account_id
      AND mt5_accounts.user_id = auth.uid()
    )
  );