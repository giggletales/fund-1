/*
  # Secure Admin Access System with Role-Based Security

  ## Overview
  This migration creates a secure admin access system and prevents data deletion
  from critical tables to protect user data integrity.

  ## 1. Admin Role System
    - Creates `admin_roles` table to track admin users
    - Adds helper function `is_admin()` to check if current user is admin
    - Only specific users in this table can access admin functions

  ## 2. Security for user_challenges table
    - Users can SELECT their own challenges
    - Admins can SELECT all challenges
    - Admins can UPDATE challenges
    - **NO DELETE policy - deletion is completely blocked**

  ## 3. Admin Functions  
    - `get_users_for_admin()` - Returns all users for admin panel (admin only)
    - `get_all_user_challenges_for_admin()` - Returns all challenges (admin only)

  ## Security Notes
  - DATA INTEGRITY IS PARAMOUNT - No deletion allowed
  - Only admins in admin_roles table can access admin functions
  - All policies use is_admin() helper for consistent security
*/

-- =====================================================
-- 1. CREATE ADMIN ROLES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'admin',
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(user_id)
);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Admins can view all admin roles
CREATE POLICY "Admins can view admin roles"
  ON admin_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
    )
  );

-- Only service role can manage admin roles
CREATE POLICY "Service role can manage admin roles"
  ON admin_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. CREATE ADMIN HELPER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = auth.uid()
  );
END;
$$;

-- =====================================================
-- 3. SECURE USER_CHALLENGES TABLE
-- =====================================================

-- Drop existing admin policies if any
DROP POLICY IF EXISTS "Admins can view all user challenges" ON user_challenges;
DROP POLICY IF EXISTS "Admins can update user challenges" ON user_challenges;
DROP POLICY IF EXISTS "Admins can delete user challenges" ON user_challenges;

-- Policy: Admins can view all challenges
CREATE POLICY "Admins can view all user challenges"
  ON user_challenges FOR SELECT
  TO authenticated
  USING (is_admin());

-- Policy: Admins can update challenges
CREATE POLICY "Admins can update user challenges"
  ON user_challenges FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- NO DELETE POLICY - Deletion is completely blocked for data safety

-- =====================================================
-- 4. CREATE ADMIN FUNCTIONS
-- =====================================================

-- Function to get all users for admin panel
CREATE OR REPLACE FUNCTION get_users_for_admin()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::text,
    au.raw_user_meta_data->>'full_name' as full_name,
    au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;

-- Function to get all challenges for admin panel
CREATE OR REPLACE FUNCTION get_all_challenges_for_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_email text,
  user_name text,
  unique_user_id text,
  account_size numeric,
  challenge_fee numeric,
  phase text,
  status text,
  platform text,
  login_id text,
  has_credentials boolean,
  current_balance numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    uc.id,
    uc.user_id,
    au.email::text as user_email,
    (au.raw_user_meta_data->>'full_name')::text as user_name,
    uc.trading_account_id as unique_user_id,
    uc.account_size::numeric,
    uc.amount_paid as challenge_fee,
    CASE 
      WHEN uc.current_phase = 1 THEN 'phase_1'
      WHEN uc.current_phase = 2 THEN 'phase_2'
      ELSE 'funded'
    END as phase,
    uc.status,
    'MT5' as platform,
    uc.trading_account_id as login_id,
    (uc.trading_account_id IS NOT NULL) as has_credentials,
    0::numeric as current_balance,
    uc.purchase_date as created_at
  FROM user_challenges uc
  LEFT JOIN auth.users au ON au.id = uc.user_id
  ORDER BY uc.purchase_date DESC;
END;
$$;

-- =====================================================
-- 5. GRANT EXECUTE PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_challenges_for_admin() TO authenticated;