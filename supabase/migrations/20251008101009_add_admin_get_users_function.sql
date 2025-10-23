/*
  # Add Admin User Listing Function
  
  1. Purpose
    - Allows admins to list users for MT5 account assignment
    - Provides basic user information needed for account creation
  
  2. Security
    - Function is accessible to authenticated users
    - Returns only necessary user information (id, email, metadata)
*/

-- Create function to get users list
CREATE OR REPLACE FUNCTION get_users_for_admin()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  full_name text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at,
    (au.raw_user_meta_data->>'full_name')::text as full_name
  FROM auth.users au
  WHERE au.email IS NOT NULL
  ORDER BY au.created_at DESC
  LIMIT 100;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_for_admin() TO authenticated;
