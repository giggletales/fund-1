/*
  # Add Payment Insert Policy

  ## Changes
  - Add RLS policy to allow authenticated users to insert their own payment records
  
  ## Security
  - Users can only insert payments for themselves (user_id must match auth.uid())
*/

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
