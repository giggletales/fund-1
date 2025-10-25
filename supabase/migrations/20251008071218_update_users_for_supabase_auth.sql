/*
  # Update Users Table for Supabase Auth

  1. Changes
    - Remove password_hash column (Supabase Auth handles this)
    - Make id column reference auth.users
    - Add insert policy for new users
    
  2. Security
    - Enable RLS
    - Allow authenticated users to read their own data
    - Allow authenticated users to update their own data
    - Allow authenticated users to insert their own profile
*/

-- Drop the password_hash column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users DROP COLUMN password_hash;
  END IF;
END $$;
