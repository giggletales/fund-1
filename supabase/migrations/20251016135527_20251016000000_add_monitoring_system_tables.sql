/*
  # Add Monitoring System Tables

  1. New Tables
    - `account_metrics` - Stores real-time trading metrics for each MT5 account
    - `rule_violations` - Records all rule violations detected by the monitoring system
    - `notifications` - User notification system for alerts and updates
    - `certificates` - Stores certificate generation records for passed challenges
    - `affiliates` - Affiliate program management
    - `referrals` - Tracks referral relationships between affiliates and users
    - `commissions` - Commission tracking for affiliate earnings
    - `payouts_affiliate` - Payout requests and processing for affiliates

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

CREATE TABLE IF NOT EXISTS account_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mt5_account_id uuid REFERENCES mt5_accounts(account_id) ON DELETE CASCADE NOT NULL,
  balance decimal NOT NULL,
  equity decimal NOT NULL,
  profit decimal NOT NULL,
  margin_level decimal,
  daily_drawdown decimal DEFAULT 0,
  max_drawdown decimal DEFAULT 0,
  profit_target_reached boolean DEFAULT false,
  trading_days integer DEFAULT 0,
  consistency_score decimal DEFAULT 0,
  total_trades integer DEFAULT 0,
  timestamp timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_account_metrics_mt5_account ON account_metrics(mt5_account_id);
CREATE INDEX IF NOT EXISTS idx_account_metrics_timestamp ON account_metrics(timestamp);

ALTER TABLE account_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own account metrics"
  ON account_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mt5_accounts
      WHERE mt5_accounts.account_id = account_metrics.mt5_account_id
      AND mt5_accounts.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS rule_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mt5_account_id uuid REFERENCES mt5_accounts(account_id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rule_type text NOT NULL,
  current_value decimal NOT NULL,
  limit_value decimal NOT NULL,
  severity text NOT NULL CHECK (severity IN ('warning', 'critical')),
  timestamp timestamptz DEFAULT now() NOT NULL,
  resolved boolean DEFAULT false,
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_rule_violations_mt5_account ON rule_violations(mt5_account_id);
CREATE INDEX IF NOT EXISTS idx_rule_violations_user ON rule_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_rule_violations_severity ON rule_violations(severity);

ALTER TABLE rule_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rule violations"
  ON rule_violations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read boolean DEFAULT false,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  created_at timestamptz DEFAULT now() NOT NULL,
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mt5_account_id uuid REFERENCES mt5_accounts(account_id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  certificate_path text NOT NULL,
  issued_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_account ON certificates(mt5_account_id);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  affiliate_code text NOT NULL UNIQUE,
  commission_rate decimal DEFAULT 10 NOT NULL,
  total_referrals integer DEFAULT 0,
  total_earnings decimal DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_user ON affiliates(user_id);

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own affiliate data"
  ON affiliates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own affiliate data"
  ON affiliates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL,
  converted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON referrals(referred_user_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = referrals.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  referral_id uuid REFERENCES referrals(id) ON DELETE CASCADE NOT NULL,
  payment_id uuid REFERENCES payments(id) ON DELETE CASCADE NOT NULL,
  amount decimal NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL,
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_referral ON commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = commissions.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS payouts_affiliate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  amount decimal NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  payment_method text,
  payment_details jsonb,
  requested_at timestamptz DEFAULT now() NOT NULL,
  processed_at timestamptz,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_payouts_affiliate_id ON payouts_affiliate(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate_status ON payouts_affiliate(status);

ALTER TABLE payouts_affiliate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own payouts"
  ON payouts_affiliate FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = payouts_affiliate.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can request payouts"
  ON payouts_affiliate FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM affiliates
      WHERE affiliates.id = payouts_affiliate.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );