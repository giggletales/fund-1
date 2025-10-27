/*
  # Fix Downloads Table RLS Policy

  1. Changes
    - Drop the problematic admin policy that queries auth.users table
    - Admin access should be handled differently (via service role or backend)
    - Keep the user policy that allows users to view their own downloads

  2. Security
    - Users can only see their own downloads
    - Admin access removed from RLS (should use service role key instead)
*/

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all downloads" ON downloads;

-- The "Users can view own downloads" policy remains and works fine
-- Users can view their own downloads: (auth.uid() = user_id)
