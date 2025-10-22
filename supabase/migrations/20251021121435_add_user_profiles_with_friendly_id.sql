/*
  # Add User Profiles with Friendly IDs

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `user_number` (integer, unique, 4-5 digits)
      - `first_name` (text)
      - `last_name` (text)
      - `country` (text)
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on `user_profiles` table
    - Users can read their own profile
    - Users can update their own profile
    
  3. Functions
    - Auto-generate user_number on insert
*/

-- Create sequence for user numbers starting at 10000
CREATE SEQUENCE IF NOT EXISTS user_number_seq START WITH 10000 INCREMENT BY 1;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_number integer UNIQUE NOT NULL DEFAULT nextval('user_number_seq'),
  first_name text,
  last_name text,
  country text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_user_number_idx ON user_profiles(user_number);
