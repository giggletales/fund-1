/*
  # Billing & Transactions System

  1. New Tables
    - `transactions`
      - Complete payment and payout records
      - Challenge purchases, payouts, refunds
      - Payment gateway integration data
    
  2. Security
    - RLS enabled
    - Users can only view their own transactions
    - Admins can view all

  3. Features
    - Invoice generation
    - Payout tracking
    - Payment method tracking
    - Tax information
    - Discount codes
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES user_challenges(id) ON DELETE SET NULL,
  
  -- Transaction Type
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'CHALLENGE_PURCHASE',
    'PAYOUT',
    'REFUND',
    'SCALING',
    'SUBSCRIPTION',
    'ADDON'
  )),
  
  -- Payment Details
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  payment_method text NOT NULL CHECK (payment_method IN (
    'stripe',
    'paypal',
    'crypto',
    'bank_transfer',
    'other'
  )),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'cancelled'
  )),
  
  -- Payment Gateway Details
  payment_gateway_id text,
  payment_gateway_response jsonb,
  payment_method_last4 text,
  payment_method_brand text,
  
  -- Transaction IDs
  transaction_id text UNIQUE,
  invoice_number text UNIQUE,
  receipt_url text,
  
  -- Challenge Details (for purchases)
  challenge_type text,
  account_size numeric,
  account_equity numeric,
  purchase_date timestamptz,
  activation_date timestamptz,
  expiry_date timestamptz,
  profit_target numeric,
  max_daily_loss numeric,
  max_total_loss numeric,
  current_balance numeric,
  current_equity numeric,
  current_profit numeric,
  account_status text,
  
  -- Payout Details (for payouts)
  payout_period_start timestamptz,
  payout_period_end timestamptz,
  profit_earned numeric,
  trader_share numeric,
  company_share numeric,
  payout_amount numeric,
  payout_method text,
  payout_destination text,
  payout_date timestamptz,
  payout_reference text,
  
  -- Billing Address
  billing_full_name text,
  billing_email text,
  billing_country text,
  billing_state text,
  billing_city text,
  billing_zip text,
  billing_address text,
  
  -- Tax Information
  tax_amount numeric DEFAULT 0,
  tax_rate numeric DEFAULT 0,
  tax_country text,
  vat_number text,
  
  -- Discount/Promo
  discount_code text,
  discount_amount numeric DEFAULT 0,
  discount_percentage numeric DEFAULT 0,
  affiliate_code text,
  
  -- Refund Info
  refund_amount numeric,
  refund_reason text,
  refund_date timestamptz,
  refund_reference text,
  
  -- Metadata
  ip_address text,
  user_agent text,
  device_type text,
  location text,
  
  -- Notes
  notes text,
  admin_notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_number);

-- Function to auto-generate transaction ID
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_id IS NULL THEN
    NEW.transaction_id := 'TXN' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 8);
  END IF;
  
  IF NEW.invoice_number IS NULL AND NEW.transaction_type = 'CHALLENGE_PURCHASE' THEN
    NEW.invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_sequence')::text, 6, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for invoices
CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1;

CREATE TRIGGER set_transaction_id
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION generate_transaction_id();

-- Update trigger
CREATE TRIGGER update_transactions_timestamp
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_timestamp();

-- Function to get user billing summary
CREATE OR REPLACE FUNCTION get_billing_summary(p_user_id uuid)
RETURNS TABLE (
  total_spent numeric,
  total_payouts numeric,
  total_refunds numeric,
  transaction_count bigint,
  last_transaction_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN transaction_type = 'CHALLENGE_PURCHASE' THEN amount ELSE 0 END), 0) as total_spent,
    COALESCE(SUM(CASE WHEN transaction_type = 'PAYOUT' THEN amount ELSE 0 END), 0) as total_payouts,
    COALESCE(SUM(CASE WHEN transaction_type = 'REFUND' THEN refund_amount ELSE 0 END), 0) as total_refunds,
    COUNT(*)::bigint as transaction_count,
    MAX(created_at) as last_transaction_date
  FROM transactions
  WHERE user_id = p_user_id
  AND payment_status = 'completed';
END;
$$;
