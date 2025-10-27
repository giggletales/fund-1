/*
  # Contract Signing System

  1. New Tables
    - `contracts`
      - Contract signing records with full legal details
      - User information and signatures
      - Challenge details and terms
      - PDF storage and tracking
    
  2. Security
    - RLS enabled on all tables
    - Users can only view their own contracts
    - Admins can view all contracts

  3. Features
    - Electronic signature tracking
    - IP address logging
    - Agreement checkboxes
    - PDF generation tracking
    - Contract versioning
*/

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES user_challenges(id) ON DELETE SET NULL,
  
  -- User Information
  full_name text NOT NULL,
  email text NOT NULL,
  date_of_birth date NOT NULL,
  country text NOT NULL,
  phone_number text,
  address_street text,
  address_city text,
  address_state text,
  address_zip text,
  address_country text,
  
  -- Contract Type
  contract_type text NOT NULL DEFAULT 'CHALLENGE_AGREEMENT',
  contract_version text NOT NULL DEFAULT '1.0',
  
  -- Challenge Details (snapshot at signing time)
  challenge_type text NOT NULL,
  account_size numeric NOT NULL,
  purchase_price numeric NOT NULL,
  profit_target numeric NOT NULL,
  max_daily_loss numeric NOT NULL,
  max_total_loss numeric NOT NULL,
  
  -- Agreements (8 required checkboxes)
  agree_terms boolean NOT NULL DEFAULT false,
  agree_risk_disclosure boolean NOT NULL DEFAULT false,
  agree_privacy_policy boolean NOT NULL DEFAULT false,
  agree_refund_policy boolean NOT NULL DEFAULT false,
  agree_trading_rules boolean NOT NULL DEFAULT false,
  agree_age_confirmation boolean NOT NULL DEFAULT false,
  agree_accurate_info boolean NOT NULL DEFAULT false,
  agree_anti_money_laundering boolean NOT NULL DEFAULT false,
  
  -- Signature Details
  electronic_signature text NOT NULL,
  signature_ip_address text NOT NULL,
  signature_user_agent text,
  signature_timestamp timestamptz NOT NULL DEFAULT now(),
  
  -- Contract Text (full text at time of signing)
  contract_text text NOT NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'signed' CHECK (status IN ('signed', 'voided', 'terminated')),
  
  -- PDF Storage
  pdf_url text,
  pdf_generated_at timestamptz,
  
  -- Timestamps
  signed_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz,
  terminated_at timestamptz,
  
  -- Admin Notes
  admin_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts"
  ON contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update contracts"
  ON contracts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_challenge_id ON contracts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_signed_at ON contracts(signed_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_email ON contracts(email);

-- Function to check if contract exists for challenge
CREATE OR REPLACE FUNCTION has_signed_contract(p_user_id uuid, p_challenge_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM contracts
    WHERE user_id = p_user_id
    AND challenge_id = p_challenge_id
    AND status = 'signed'
  );
END;
$$;

-- Function to get user's contracts
CREATE OR REPLACE FUNCTION get_user_contracts(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  challenge_type text,
  account_size numeric,
  signed_at timestamptz,
  status text,
  pdf_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.challenge_type,
    c.account_size,
    c.signed_at,
    c.status,
    c.pdf_url
  FROM contracts c
  WHERE c.user_id = p_user_id
  ORDER BY c.signed_at DESC;
END;
$$;

-- Add contract_signed flag to user_challenges
ALTER TABLE user_challenges 
ADD COLUMN IF NOT EXISTS contract_signed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES contracts(id),
ADD COLUMN IF NOT EXISTS credentials_visible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS credentials_released_at timestamptz;

-- Update trigger for contracts
CREATE OR REPLACE FUNCTION update_contract_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contracts_timestamp
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_timestamp();
