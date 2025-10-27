/*
  # Secure Admin Access and Prevent Data Deletion

  ## Overview
  This migration secures the admin access system and prevents any data deletion
  from critical tables to protect user data integrity.

  ## 1. Admin Role System
    - Creates `admin_roles` table to track admin users
    - Adds helper function `is_admin()` to check if current user is admin
    - Only specific users can be marked as admins

  ## 2. Security Changes for mt5_accounts table
    - Users can SELECT their own MT5 accounts
    - Admins can SELECT all MT5 accounts
    - Admins can INSERT new MT5 accounts
    - Admins can UPDATE MT5 accounts
    - **NO DELETE policy - deletion is completely blocked**

  ## 3. Security Changes for challenges table
    - Users can SELECT their own challenges
    - Admins can SELECT all challenges
    - Users/System can INSERT challenges
    - Admins can UPDATE challenges
    - **NO DELETE policy - deletion is completely blocked**

  ## 4. Admin Functions
    - `get_users_for_admin()` - Returns all users for admin panel (admin only)
    - `get_all_challenges_for_admin()` - Returns all challenges (admin only)
    - `get_all_mt5_accounts_for_admin()` - Returns all MT5 accounts (admin only)

  ## Security Notes
  - DATA INTEGRITY IS PARAMOUNT - No deletion allowed
  - Only admins in admin_roles table can access admin functions
  - All policies use is_admin() helper for consistent security
  - Admins cannot delete their own admin role
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

-- Only super admins can insert new admin roles (use service role)
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
-- 3. SECURE MT5_ACCOUNTS TABLE
-- =====================================================

-- Drop all existing policies on mt5_accounts
DROP POLICY IF EXISTS "Users can view own MT5 accounts" ON mt5_accounts;
DROP POLICY IF EXISTS "Users can view their MT5 accounts" ON mt5_accounts;
DROP POLICY IF EXISTS "Admins can insert MT5 accounts" ON mt5_accounts;
DROP POLICY IF EXISTS "Admins can update MT5 accounts" ON mt5_accounts;
DROP POLICY IF EXISTS "Admins can delete MT5 accounts" ON mt5_accounts;
DROP POLICY IF EXISTS "Admins can view all MT5 accounts" ON mt5_accounts;

-- Policy 1: Users can view their own MT5 accounts
CREATE POLICY "Users can view own MT5 accounts"
  ON mt5_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Admins can view all MT5 accounts
CREATE POLICY "Admins can view all MT5 accounts"
  ON mt5_accounts FOR SELECT
  TO authenticated
  USING (is_admin());

-- Policy 3: Admins can insert MT5 accounts
CREATE POLICY "Admins can insert MT5 accounts"
  ON mt5_accounts FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Policy 4: Admins can update MT5 accounts
CREATE POLICY "Admins can update MT5 accounts"
  ON mt5_accounts FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- NO DELETE POLICY - Deletion is completely blocked for data safety

-- =====================================================
-- 4. SECURE CHALLENGES TABLE
-- =====================================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all challenges" ON challenges;
DROP POLICY IF EXISTS "Admins can update challenges" ON challenges;
DROP POLICY IF EXISTS "Admins can delete challenges" ON challenges;

-- Policy: Admins can view all challenges
CREATE POLICY "Admins can view all challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (is_admin());

-- Policy: Admins can update challenges
CREATE POLICY "Admins can update challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- NO DELETE POLICY - Deletion is completely blocked for data safety

-- =====================================================
-- 5. CREATE ADMIN FUNCTIONS
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
    c.id,
    c.user_id,
    au.email::text as user_email,
    (au.raw_user_meta_data->>'full_name')::text as user_name,
    c.unique_user_id,
    c.account_size,
    c.challenge_fee,
    c.phase,
    c.status,
    c.platform,
    c.login_id,
    (c.login_id IS NOT NULL) as has_credentials,
    c.current_balance,
    c.created_at
  FROM challenges c
  LEFT JOIN auth.users au ON au.id = c.user_id
  ORDER BY c.created_at DESC;
END;
$$;

-- Function to get all MT5 accounts for admin panel
CREATE OR REPLACE FUNCTION get_all_mt5_accounts_for_admin()
RETURNS TABLE (
  account_id text,
  user_id uuid,
  user_email text,
  user_name text,
  mt5_login text,
  mt5_server text,
  account_type text,
  account_size numeric,
  current_balance numeric,
  status text,
  is_sent boolean,
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
    mt5.account_id,
    mt5.user_id,
    au.email::text as user_email,
    (au.raw_user_meta_data->>'full_name')::text as user_name,
    mt5.mt5_login,
    mt5.mt5_server,
    mt5.account_type,
    mt5.account_size,
    mt5.current_balance,
    mt5.status,
    mt5.is_sent,
    mt5.created_at
  FROM mt5_accounts mt5
  LEFT JOIN auth.users au ON au.id = mt5.user_id
  ORDER BY mt5.created_at DESC;
END;
$$;

-- =====================================================
-- 6. CREATE INITIAL ADMIN USER (OPTIONAL)
-- =====================================================

-- Note: This section is commented out.
-- To create your first admin, use the Supabase dashboard to run:
-- INSERT INTO admin_roles (user_id, role, notes)
-- VALUES ('YOUR-USER-ID-HERE', 'admin', 'Initial admin user');

-- =====================================================
-- 7. GRANT EXECUTE PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_challenges_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_mt5_accounts_for_admin() TO authenticated;
