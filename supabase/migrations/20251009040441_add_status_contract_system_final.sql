/*
  # Enhanced Challenge Status Management and Contract System

  ## Changes
  
  1. Add admin role column to users
  2. Add contract acceptance fields to mt5_accounts
  3. Add credentials locking mechanism
  4. Create status history tracking table
  5. Create helper functions for contract and credentials

  ## Security
  - Contract must be signed before credentials
  - Credentials can only be sent once
  - Full audit trail
*/

-- Step 1: Add role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Step 2: Add contract fields to mt5_accounts
ALTER TABLE mt5_accounts ADD COLUMN IF NOT EXISTS contract_accepted BOOLEAN DEFAULT false;
ALTER TABLE mt5_accounts ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMPTZ;
ALTER TABLE mt5_accounts ADD COLUMN IF NOT EXISTS contract_ip_address VARCHAR(50);
ALTER TABLE mt5_accounts ADD COLUMN IF NOT EXISTS credentials_locked BOOLEAN DEFAULT false;

-- Step 3: Create status history table
CREATE TABLE IF NOT EXISTS mt5_account_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES mt5_accounts(account_id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE mt5_account_status_history ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS policies (now role column exists)
DROP POLICY IF EXISTS "Admins can view all status history" ON mt5_account_status_history;
CREATE POLICY "Admins can view all status history"
  ON mt5_account_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view own status history" ON mt5_account_status_history;
CREATE POLICY "Users can view own status history"
  ON mt5_account_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mt5_accounts 
      WHERE mt5_accounts.account_id = mt5_account_status_history.account_id
      AND mt5_accounts.user_id = auth.uid()
    )
  );

-- Step 5: Function to accept contract
CREATE OR REPLACE FUNCTION accept_contract(
  p_account_id UUID,
  p_ip_address VARCHAR(50)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_old_status VARCHAR(50);
BEGIN
  SELECT user_id, status INTO v_user_id, v_old_status
  FROM mt5_accounts
  WHERE account_id = p_account_id;

  IF v_user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE mt5_accounts
  SET 
    contract_accepted = true,
    contract_accepted_at = NOW(),
    contract_ip_address = p_ip_address,
    status = 'contract_signed',
    updated_at = NOW()
  WHERE account_id = p_account_id;

  INSERT INTO mt5_account_status_history (account_id, old_status, new_status, changed_by, notes)
  VALUES (p_account_id, v_old_status, 'contract_signed', auth.uid(), 'Contract accepted');

  RETURN jsonb_build_object('success', true, 'message', 'Contract accepted');
END;
$$;

-- Step 6: Function to send credentials (admin only)
CREATE OR REPLACE FUNCTION send_account_credentials(
  p_account_id UUID,
  p_mt5_login VARCHAR(100),
  p_mt5_password TEXT,
  p_mt5_server VARCHAR(100),
  p_investor_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_contract_accepted BOOLEAN;
  v_credentials_locked BOOLEAN;
  v_old_status VARCHAR(50);
BEGIN
  SELECT COALESCE((role = 'admin'), false) INTO v_is_admin
  FROM users WHERE id = auth.uid();

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin only');
  END IF;

  SELECT contract_accepted, credentials_locked, status 
  INTO v_contract_accepted, v_credentials_locked, v_old_status
  FROM mt5_accounts WHERE account_id = p_account_id;

  IF NOT v_contract_accepted THEN
    RETURN jsonb_build_object('success', false, 'error', 'Contract must be accepted first');
  END IF;

  IF v_credentials_locked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credentials already sent');
  END IF;

  UPDATE mt5_accounts
  SET 
    mt5_login = p_mt5_login,
    mt5_password = p_mt5_password,
    mt5_server = p_mt5_server,
    investor_password = p_investor_password,
    is_sent = true,
    sent_at = NOW(),
    credentials_locked = true,
    status = 'credentials_given',
    created_by = auth.uid(),
    updated_at = NOW()
  WHERE account_id = p_account_id;

  INSERT INTO mt5_account_status_history (account_id, old_status, new_status, changed_by, notes)
  VALUES (p_account_id, v_old_status, 'credentials_given', auth.uid(), 'Credentials sent');

  RETURN jsonb_build_object('success', true, 'message', 'Credentials sent');
END;
$$;

-- Step 7: Trigger for initial status
CREATE OR REPLACE FUNCTION set_initial_account_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS NULL OR NEW.status = '' THEN
    NEW.status := 'awaiting_contract';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_initial_status ON mt5_accounts;
CREATE TRIGGER trigger_set_initial_status
  BEFORE INSERT ON mt5_accounts
  FOR EACH ROW
  EXECUTE FUNCTION set_initial_account_status();
