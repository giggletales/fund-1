/*
  # Fix get_users_for_admin function return type
  
  1. Changes
    - Update return type for email column from text to varchar(255) to match auth.users.email column type
    - This fixes the "structure of query does not match function result type" error
*/

DROP FUNCTION IF EXISTS get_users_for_admin();

CREATE OR REPLACE FUNCTION get_users_for_admin()
RETURNS TABLE(
  id uuid, 
  email character varying(255), 
  created_at timestamp with time zone, 
  full_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
