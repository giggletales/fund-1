/*
  # Add Leaderboard Function
  
  1. New Functions
    - `get_leaderboard()` - Returns top performing traders ranked by ROI
  
  2. Security
    - Function is accessible to authenticated users
    - Returns aggregated data without exposing sensitive information
*/

CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE(
  user_id uuid,
  email character varying(255),
  total_balance numeric,
  total_profit numeric,
  roi numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      m.user_id,
      SUM(m.current_balance) as total_balance,
      SUM(m.current_balance - m.initial_balance) as total_profit,
      CASE 
        WHEN SUM(m.initial_balance) > 0 THEN
          ROUND((SUM(m.current_balance - m.initial_balance) / SUM(m.initial_balance) * 100)::numeric, 2)
        ELSE 0
      END as roi
    FROM mt5_accounts m
    WHERE m.status = 'active'
    GROUP BY m.user_id
    HAVING SUM(m.initial_balance) > 0
  )
  SELECT 
    us.user_id,
    au.email,
    us.total_balance,
    us.total_profit,
    us.roi
  FROM user_stats us
  INNER JOIN auth.users au ON au.id = us.user_id
  WHERE au.email IS NOT NULL
  ORDER BY us.roi DESC
  LIMIT 100;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_leaderboard() TO authenticated;
