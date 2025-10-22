/*
  # Create Email Verifications and Update Challenge Pricing Tables

  1. New Tables
    - `email_verifications` - Email verification code management

  2. Updated Tables
    - Add new columns to `challenge_pricing` table
    - Populate with comprehensive pricing data

  3. Security
    - Enable RLS on email_verifications
    - Update RLS policies for challenge_pricing
*/

-- ============================================================
-- EMAIL VERIFICATIONS TABLE
-- ============================================================

-- Drop and recreate with exact specifications
DROP TABLE IF EXISTS email_verifications CASCADE;

CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  verification_code VARCHAR(6) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE NOT NULL,
  code_expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_is_verified ON email_verifications(is_verified);
CREATE INDEX idx_email_verifications_code_expires ON email_verifications(code_expires_at);

-- Enable RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authentication flow
DROP POLICY IF EXISTS "Allow all operations on email_verifications" ON email_verifications;
CREATE POLICY "Allow all operations on email_verifications"
  ON email_verifications
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_verifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_verifications_timestamp_trigger ON email_verifications;
CREATE TRIGGER update_email_verifications_timestamp_trigger
  BEFORE UPDATE ON email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_email_verifications_timestamp();

-- ============================================================
-- UPDATE CHALLENGE PRICING TABLE
-- ============================================================

-- Add new columns to existing challenge_pricing table
DO $$
BEGIN
  -- Add regular_price column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'regular_price') THEN
    ALTER TABLE challenge_pricing ADD COLUMN regular_price DECIMAL(10,2);
  END IF;

  -- Add discount_price column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'discount_price') THEN
    ALTER TABLE challenge_pricing ADD COLUMN discount_price DECIMAL(10,2);
  END IF;

  -- Add platform_cost column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'platform_cost') THEN
    ALTER TABLE challenge_pricing ADD COLUMN platform_cost DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- Add daily_dd_pct column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'daily_dd_pct') THEN
    ALTER TABLE challenge_pricing ADD COLUMN daily_dd_pct DECIMAL(5,2) DEFAULT 5.00;
  END IF;

  -- Add max_dd_pct column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'max_dd_pct') THEN
    ALTER TABLE challenge_pricing ADD COLUMN max_dd_pct DECIMAL(5,2) DEFAULT 10.00;
  END IF;

  -- Add min_trading_days column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'min_trading_days') THEN
    ALTER TABLE challenge_pricing ADD COLUMN min_trading_days INTEGER DEFAULT 4;
  END IF;

  -- Add time_limit_days column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'time_limit_days') THEN
    ALTER TABLE challenge_pricing ADD COLUMN time_limit_days INTEGER DEFAULT 60;
  END IF;

  -- Add updated_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'updated_at') THEN
    ALTER TABLE challenge_pricing ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add unique constraint if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'challenge_pricing_type_size_unique'
  ) THEN
    ALTER TABLE challenge_pricing 
    ADD CONSTRAINT challenge_pricing_type_size_unique 
    UNIQUE (challenge_type, account_size);
  END IF;
END $$;

-- Update existing data to populate new columns
UPDATE challenge_pricing
SET 
  regular_price = COALESCE(regular_price, phase_1_price),
  discount_price = COALESCE(discount_price, COALESCE(phase_2_price, phase_1_price * 0.80)),
  updated_at = NOW()
WHERE regular_price IS NULL OR discount_price IS NULL;

-- Create indexes on columns
CREATE INDEX IF NOT EXISTS idx_challenge_pricing_type ON challenge_pricing(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenge_pricing_size ON challenge_pricing(account_size);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_challenge_pricing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_challenge_pricing_timestamp_trigger ON challenge_pricing;
CREATE TRIGGER update_challenge_pricing_timestamp_trigger
  BEFORE UPDATE ON challenge_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_pricing_timestamp();

-- ============================================================
-- POPULATE CHALLENGE PRICING DATA
-- ============================================================

-- Function to upsert pricing data
CREATE OR REPLACE FUNCTION upsert_challenge_pricing(
  p_challenge_type TEXT,
  p_account_size NUMERIC,
  p_phase_1_price NUMERIC,
  p_phase_2_price NUMERIC,
  p_regular_price NUMERIC,
  p_discount_price NUMERIC,
  p_platform_cost NUMERIC,
  p_daily_dd_pct NUMERIC,
  p_max_dd_pct NUMERIC,
  p_min_trading_days INTEGER,
  p_time_limit_days INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Check if record exists
  IF EXISTS (
    SELECT 1 FROM challenge_pricing 
    WHERE challenge_type = p_challenge_type 
    AND account_size = p_account_size
  ) THEN
    -- Update existing record
    UPDATE challenge_pricing
    SET
      phase_1_price = p_phase_1_price,
      phase_2_price = p_phase_2_price,
      regular_price = p_regular_price,
      discount_price = p_discount_price,
      platform_cost = p_platform_cost,
      daily_dd_pct = p_daily_dd_pct,
      max_dd_pct = p_max_dd_pct,
      min_trading_days = p_min_trading_days,
      time_limit_days = p_time_limit_days,
      is_active = true,
      updated_at = NOW()
    WHERE challenge_type = p_challenge_type 
    AND account_size = p_account_size;
  ELSE
    -- Insert new record
    INSERT INTO challenge_pricing (
      challenge_type,
      account_size,
      phase_1_price,
      phase_2_price,
      regular_price,
      discount_price,
      platform_cost,
      daily_dd_pct,
      max_dd_pct,
      min_trading_days,
      time_limit_days,
      is_active
    ) VALUES (
      p_challenge_type,
      p_account_size,
      p_phase_1_price,
      p_phase_2_price,
      p_regular_price,
      p_discount_price,
      p_platform_cost,
      p_daily_dd_pct,
      p_max_dd_pct,
      p_min_trading_days,
      p_time_limit_days,
      true
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert/Update Regular Challenges: 5K, 10K, 25K, 50K, 100K, 200K
SELECT upsert_challenge_pricing('regular', 5000, 49.00, 39.00, 49.00, 39.00, 10.00, 5.00, 10.00, 4, 60);
SELECT upsert_challenge_pricing('regular', 10000, 99.00, 79.00, 99.00, 79.00, 15.00, 5.00, 10.00, 4, 60);
SELECT upsert_challenge_pricing('regular', 25000, 199.00, 159.00, 199.00, 159.00, 25.00, 5.00, 10.00, 4, 60);
SELECT upsert_challenge_pricing('regular', 50000, 299.00, 239.00, 299.00, 239.00, 35.00, 5.00, 10.00, 4, 60);
SELECT upsert_challenge_pricing('regular', 100000, 499.00, 399.00, 499.00, 399.00, 50.00, 5.00, 10.00, 4, 60);
SELECT upsert_challenge_pricing('regular', 200000, 899.00, 719.00, 899.00, 719.00, 75.00, 5.00, 10.00, 4, 60);

-- Insert/Update Elite Royal Challenges: 300K, 500K, 1M, 2M
SELECT upsert_challenge_pricing('elite_royal', 300000, 1299.00, 1039.00, 1299.00, 1039.00, 100.00, 4.00, 8.00, 5, 90);
SELECT upsert_challenge_pricing('elite_royal', 500000, 1999.00, 1599.00, 1999.00, 1599.00, 150.00, 4.00, 8.00, 5, 90);
SELECT upsert_challenge_pricing('elite_royal', 1000000, 3499.00, 2799.00, 3499.00, 2799.00, 250.00, 4.00, 8.00, 5, 90);
SELECT upsert_challenge_pricing('elite_royal', 2000000, 5999.00, 4799.00, 5999.00, 4799.00, 400.00, 4.00, 8.00, 5, 90);

-- Clean up the upsert function
DROP FUNCTION IF EXISTS upsert_challenge_pricing;