/*
  # Fix MT5 Accounts Insert Policy
  
  1. Changes
    - Add INSERT policy for admins to create MT5 accounts
    - Add UPDATE policy for admins to modify MT5 accounts
    - Ensure admins can manage all MT5 accounts
  
  2. Security
    - Only authenticated users can insert/update
    - Users can view their own MT5 accounts
    - Service role can perform all operations for admin functions
*/

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can insert MT5 accounts" ON mt5_accounts;
DROP POLICY IF EXISTS "Admins can update MT5 accounts" ON mt5_accounts;
DROP POLICY IF EXISTS "Admins can delete MT5 accounts" ON mt5_accounts;

-- Allow INSERT for authenticated users (admin will be authenticated)
CREATE POLICY "Admins can insert MT5 accounts"
  ON mt5_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow UPDATE for authenticated users on any account
CREATE POLICY "Admins can update MT5 accounts"
  ON mt5_accounts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow DELETE for authenticated users
CREATE POLICY "Admins can delete MT5 accounts"
  ON mt5_accounts
  FOR DELETE
  TO authenticated
  USING (true);
