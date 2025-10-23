-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================
-- This will add the FREETRIAL100 coupon with 100% discount
-- and ensure all coupon functions have proper permissions
-- ============================================

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

-- Verify the coupon was created (check messages tab for confirmation)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM coupons WHERE code = 'FREETRIAL100' AND discount_percent = 100) THEN
    RAISE NOTICE 'SUCCESS: FREETRIAL100 coupon created with 100%% discount!';
  END IF;
END $$;

-- Show all active coupons for verification
SELECT code, discount_percent, challenge_type, is_active, max_uses, current_uses, expires_at
FROM coupons
WHERE is_active = true
ORDER BY discount_percent DESC;
