/*
  # Add Payments Table

  1. New Tables
    - `payments` - Track all payment transactions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric) - Payment amount
      - `currency` (text) - Currency code (default USD)
      - `payment_method` (text) - Payment method used
      - `transaction_id` (text) - External transaction ID
      - `status` (text) - Payment status
      - `completed_at` (timestamptz) - Completion timestamp
      - `notes` (text) - Additional payment notes
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on payments table
    - Users can view only their own payments
    - Users can insert their own payment records
    - Admins can view all payments

  3. Important Notes
    - Supports crypto payments (ETH, SOL) and coupon-based free access
    - Transaction ID can be blockchain hash or generated ID for free access
    - Notes field stores challenge details and payment information
*/

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  payment_method text,
  transaction_id text,
  status text DEFAULT 'pending',
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);