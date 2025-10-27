/*
  # FluxFunded Complete Database Schema
  
  1. Tables Created
    - users: User accounts with authentication
    - challenges: Trading evaluation accounts
    - orders: Trading history
    - daily_stats: Daily performance tracking
    - payments: Payment records
    - payouts: Payout requests
    - notifications: User notifications
    - support_tickets: Support system
    - ticket_messages: Support conversations
    - certificates: Achievement certificates
    - warning_log: Rule warning tracking
    - email_log: Email delivery tracking
    - platform_settings: System configuration
    
  2. Security
    - RLS enabled on all tables
    - Policies for authenticated users
    - Foreign key relationships
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    first_name text,
    last_name text,
    country text,
    phone text,
    created_at timestamptz DEFAULT now(),
    last_login timestamptz,
    email_verified boolean DEFAULT false,
    kyc_status text DEFAULT 'pending',
    status text DEFAULT 'active',
    referral_code text UNIQUE,
    referred_by uuid REFERENCES users(id)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_size numeric(15,2) NOT NULL,
    challenge_fee numeric(10,2) NOT NULL,
    phase text NOT NULL DEFAULT 'phase1',
    status text DEFAULT 'active',
    platform text,
    server_name text,
    login_id text,
    password text,
    investor_password text,
    start_date timestamptz DEFAULT now(),
    end_date timestamptz,
    profit_target numeric(10,2),
    current_balance numeric(15,2),
    highest_balance numeric(15,2),
    current_profit numeric(15,2) DEFAULT 0,
    max_drawdown_percent numeric(5,2) DEFAULT 6.00,
    max_daily_loss_percent numeric(5,2) DEFAULT 3.00,
    current_drawdown_percent numeric(5,2) DEFAULT 0,
    trading_days_completed int DEFAULT 0,
    trading_days_required int DEFAULT 5,
    notes text,
    created_at timestamptz DEFAULT now()
);

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

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    ticket_number text,
    symbol text,
    order_type text,
    lot_size numeric(10,2),
    open_price numeric(15,5),
    close_price numeric(15,5),
    open_time timestamptz,
    close_time timestamptz,
    profit_loss numeric(15,2),
    commission numeric(10,2),
    swap numeric(10,2),
    net_profit numeric(15,2),
    stop_loss numeric(15,5),
    take_profit numeric(15,5),
    comment text,
    created_at timestamptz DEFAULT now()
);

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

CREATE POLICY "Users can insert orders for own challenges"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = orders.challenge_id
      AND challenges.user_id = auth.uid()
    )
  );

-- Daily stats table
CREATE TABLE IF NOT EXISTS daily_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    date date NOT NULL,
    starting_balance numeric(15,2),
    ending_balance numeric(15,2),
    daily_profit_loss numeric(15,2),
    daily_loss_percent numeric(5,2),
    trades_opened int DEFAULT 0,
    trades_closed int DEFAULT 0,
    is_trading_day boolean DEFAULT false,
    max_drawdown_reached numeric(5,2),
    breached boolean DEFAULT false,
    breach_reason text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(challenge_id, date)
);

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

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id uuid REFERENCES challenges(id) ON DELETE SET NULL,
    payment_type text,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD',
    payment_method text,
    transaction_id text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    notes text
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    requested_amount numeric(15,2) NOT NULL,
    profit_split_percent numeric(5,2) NOT NULL,
    trader_share numeric(15,2) NOT NULL,
    company_share numeric(15,2) NOT NULL,
    payout_method text,
    payout_details text,
    status text DEFAULT 'requested',
    requested_at timestamptz DEFAULT now(),
    processed_at timestamptz,
    completed_at timestamptz,
    rejection_reason text,
    transaction_reference text
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can request payouts"
  ON payouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type text,
    title text,
    message text,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    read_at timestamptz,
    action_url text
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject text NOT NULL,
    category text,
    priority text DEFAULT 'medium',
    status text DEFAULT 'open',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    closed_at timestamptz
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ticket messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
    sender_type text,
    message text NOT NULL,
    attachment_url text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for own tickets"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    phase text,
    certificate_code text UNIQUE,
    issued_at timestamptz DEFAULT now(),
    certificate_url text
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Warning log table
CREATE TABLE IF NOT EXISTS warning_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    warning_key text,
    sent_at timestamptz DEFAULT now()
);

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
  );

-- Email log table
CREATE TABLE IF NOT EXISTS email_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email text,
    template_name text,
    subject text,
    status text,
    message_id text,
    error_message text,
    sent_at timestamptz DEFAULT now()
);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert email logs"
  ON email_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key text UNIQUE NOT NULL,
    setting_value text,
    description text,
    updated_at timestamptz DEFAULT now()
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