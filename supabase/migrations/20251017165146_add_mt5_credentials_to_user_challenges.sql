/*
  # Add MT5 Credentials to User Challenges

  1. Changes
    - Add `trading_account_password` column to store MT5 password
    - Add `trading_account_server` column to store MT5 server
    - Add `credentials_sent` boolean to track if credentials were sent to user
    - Add `credentials_sent_at` timestamp to track when credentials were sent

  2. Security
    - No RLS changes needed - inherits existing policies
*/

-- Add MT5 credentials columns
ALTER TABLE user_challenges 
ADD COLUMN IF NOT EXISTS trading_account_password text,
ADD COLUMN IF NOT EXISTS trading_account_server text DEFAULT 'MetaQuotes-Demo',
ADD COLUMN IF NOT EXISTS credentials_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS credentials_sent_at timestamptz;