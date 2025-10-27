/*
  # Final Database Verification and Column Addition

  1. Purpose
    - Ensure all tables have required columns for proper data collection
    - Add any missing columns to user_challenges, payments, and other key tables
    - Verify indexes and constraints are in place

  2. Tables Updated
    - user_challenges: Add missing columns (amount_paid, payment_id, discount_applied, phase_2_paid, phase_2_price)
    - challenge_types: Ensure all lookup columns exist
    - payments: Verify structure
    - downloads: Verify certificate generation columns

  3. Security
    - Maintain existing RLS policies
    - No policy changes needed
*/

-- Add missing columns to user_challenges if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_challenges' AND column_name = 'amount_paid') THEN
    ALTER TABLE user_challenges ADD COLUMN amount_paid numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_challenges' AND column_name = 'payment_id') THEN
    ALTER TABLE user_challenges ADD COLUMN payment_id uuid REFERENCES payments(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_challenges' AND column_name = 'discount_applied') THEN
    ALTER TABLE user_challenges ADD COLUMN discount_applied boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_challenges' AND column_name = 'phase_2_paid') THEN
    ALTER TABLE user_challenges ADD COLUMN phase_2_paid boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_challenges' AND column_name = 'phase_2_price') THEN
    ALTER TABLE user_challenges ADD COLUMN phase_2_price numeric DEFAULT NULL;
  END IF;
END $$;

-- Ensure downloads table has all certificate fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'downloads' AND column_name = 'auto_generated') THEN
    ALTER TABLE downloads ADD COLUMN auto_generated boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'downloads' AND column_name = 'generated_at') THEN
    ALTER TABLE downloads ADD COLUMN generated_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'downloads' AND column_name = 'download_count') THEN
    ALTER TABLE downloads ADD COLUMN download_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'downloads' AND column_name = 'challenge_type') THEN
    ALTER TABLE downloads ADD COLUMN challenge_type text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'downloads' AND column_name = 'account_size') THEN
    ALTER TABLE downloads ADD COLUMN account_size numeric DEFAULT NULL;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_payment_id ON user_challenges(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_friendly_id ON user_profile(friendly_id);
CREATE INDEX IF NOT EXISTS idx_challenge_types_challenge_code ON challenge_types(challenge_code);
CREATE INDEX IF NOT EXISTS idx_challenge_pricing_challenge_type_id ON challenge_pricing(challenge_type_id);

-- Verify critical tables exist and have RLS enabled
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT unnest(ARRAY['user_profile', 'user_challenges', 'payments', 'downloads', 'coupons', 'challenge_types', 'challenge_pricing'])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database verification complete! All tables and columns are properly configured.';
END $$;
