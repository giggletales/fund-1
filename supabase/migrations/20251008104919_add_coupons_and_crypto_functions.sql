/*
  # Add Coupons Table and Crypto Payment Functions
  
  1. New Tables
    - `coupons` - Discount coupon management
  
  2. Functions
    - validate_coupon - Check if coupon is valid
    - increment_coupon_usage - Increment usage counter
  
  3. Security
    - Enable RLS on coupons table
    - Public can view active coupons
*/

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  coupon_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent numeric NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  challenge_type text NOT NULL DEFAULT 'all',
  is_active boolean DEFAULT true,
  max_uses integer DEFAULT NULL,
  current_uses integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT NULL
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Insert 50% off coupons for each challenge type
INSERT INTO coupons (code, discount_percent, challenge_type, is_active, max_uses) VALUES
  ('STANDARD50', 50, 'standard', true, NULL),
  ('RAPID50', 50, 'rapid', true, NULL),
  ('SCALING50', 50, 'scaling', true, NULL),
  ('PRO50', 50, 'professional', true, NULL),
  ('SWING50', 50, 'swing', true, NULL),
  ('LAUNCH50', 50, 'all', true, NULL)
ON CONFLICT (code) DO NOTHING;

-- Create function to validate coupon
CREATE OR REPLACE FUNCTION validate_coupon(coupon_code text, challenge_type text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  coupon_record record;
  result json;
BEGIN
  SELECT * INTO coupon_record
  FROM coupons
  WHERE code = coupon_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (coupons.challenge_type = 'all' OR coupons.challenge_type = validate_coupon.challenge_type)
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  IF coupon_record IS NULL THEN
    result := json_build_object('valid', false, 'message', 'Invalid or expired coupon');
  ELSE
    result := json_build_object(
      'valid', true,
      'discount_percent', coupon_record.discount_percent,
      'coupon_id', coupon_record.coupon_id
    );
  END IF;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_coupon(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_coupon(text, text) TO anon;

-- Create function to increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE coupons
  SET current_uses = current_uses + 1
  WHERE code = coupon_code;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_coupon_usage(text) TO authenticated;
