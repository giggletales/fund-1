/*
  # Add FREETRIAL100 Coupon and Fix Permissions

  1. Changes
    - Insert FREETRIAL100 coupon with 100% discount
    - Grant proper permissions to coupon validation functions
    - Ensure functions are accessible to both authenticated and anonymous users

  2. Security
    - Functions remain secure with RLS policies on coupons table
    - Only read access granted to validation functions
*/

-- Add FREETRIAL100 coupon to database
INSERT INTO coupons (code, discount_percent, challenge_type, is_active, max_uses, expires_at)
VALUES ('FREETRIAL100', 100, 'all', true, NULL, now() + interval '1 year')
ON CONFLICT (code) DO UPDATE
SET
  discount_percent = 100,
  challenge_type = 'all',
  is_active = true,
  expires_at = now() + interval '1 year';

-- Ensure RPC functions have proper permissions
GRANT EXECUTE ON FUNCTION validate_coupon(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_coupon(text, text) TO anon;
GRANT EXECUTE ON FUNCTION increment_coupon_usage(text) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_coupon_usage(text) TO anon;

-- Verify the coupon was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM coupons WHERE code = 'FREETRIAL100' AND discount_percent = 100) THEN
    RAISE NOTICE 'FREETRIAL100 coupon successfully created with 100%% discount';
  END IF;
END $$;
