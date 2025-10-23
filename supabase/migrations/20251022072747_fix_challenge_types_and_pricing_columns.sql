/*
  # Fix Challenge Types and Pricing Tables

  1. Add Missing Columns to challenge_types
    - `recommended` (boolean) - marks recommended challenge types
    - `icon` (text) - icon identifier for the challenge type
    - `color` (text) - color theme for the challenge type

  2. Add Missing Columns to challenge_pricing
    - `challenge_type_id` (uuid) - foreign key to challenge_types
    - Update existing data to link with challenge_types

  3. Data Updates
    - Set recommended flags on challenge types
    - Link pricing records to challenge_types via challenge_type_id
*/

-- ============================================================
-- UPDATE CHALLENGE_TYPES TABLE
-- ============================================================

-- Add missing columns to challenge_types
DO $$
BEGIN
  -- Add recommended column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_types' AND column_name = 'recommended') THEN
    ALTER TABLE challenge_types ADD COLUMN recommended BOOLEAN DEFAULT false;
  END IF;

  -- Add icon column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_types' AND column_name = 'icon') THEN
    ALTER TABLE challenge_types ADD COLUMN icon TEXT;
  END IF;

  -- Add color column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_types' AND column_name = 'color') THEN
    ALTER TABLE challenge_types ADD COLUMN color TEXT;
  END IF;

  -- Add profit_target columns for phase 1 and 2
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_types' AND column_name = 'phase1_profit_target') THEN
    ALTER TABLE challenge_types ADD COLUMN phase1_profit_target DECIMAL(5,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_types' AND column_name = 'phase2_profit_target') THEN
    ALTER TABLE challenge_types ADD COLUMN phase2_profit_target DECIMAL(5,2);
  END IF;
END $$;

-- Update existing challenge types with proper data
UPDATE challenge_types
SET 
  recommended = CASE 
    WHEN type_name = 'standard' THEN true
    WHEN type_name = 'rapid' THEN false
    ELSE false
  END,
  icon = CASE 
    WHEN type_name = 'standard' THEN 'trophy'
    WHEN type_name = 'rapid' THEN 'zap'
    WHEN type_name = 'professional' THEN 'credit-card'
    WHEN type_name = 'swing' THEN 'flame'
    WHEN type_name = 'scaling' THEN 'trending-up'
    ELSE 'star'
  END,
  color = CASE 
    WHEN type_name = 'standard' THEN 'blue'
    WHEN type_name = 'rapid' THEN 'orange'
    WHEN type_name = 'professional' THEN 'green'
    WHEN type_name = 'swing' THEN 'red'
    WHEN type_name = 'scaling' THEN 'purple'
    ELSE 'gray'
  END,
  phase1_profit_target = CASE
    WHEN type_name IN ('standard', 'professional', 'swing', 'scaling') THEN 8.00
    WHEN type_name = 'rapid' THEN 10.00
    ELSE 8.00
  END,
  phase2_profit_target = CASE
    WHEN type_name IN ('standard', 'professional', 'swing', 'scaling') THEN 5.00
    WHEN type_name = 'rapid' THEN NULL
    ELSE 5.00
  END
WHERE recommended IS NULL OR icon IS NULL;

-- ============================================================
-- UPDATE CHALLENGE_PRICING TABLE
-- ============================================================

-- Add challenge_type_id column to challenge_pricing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_pricing' AND column_name = 'challenge_type_id') THEN
    ALTER TABLE challenge_pricing ADD COLUMN challenge_type_id UUID;
    
    -- Add foreign key constraint
    ALTER TABLE challenge_pricing 
    ADD CONSTRAINT fk_challenge_pricing_type 
    FOREIGN KEY (challenge_type_id) 
    REFERENCES challenge_types(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Update existing challenge_pricing records to link with challenge_types
UPDATE challenge_pricing cp
SET challenge_type_id = ct.id
FROM challenge_types ct
WHERE cp.challenge_type = ct.type_name
AND cp.challenge_type_id IS NULL;

-- For any records that don't have a matching type, create the type
DO $$
DECLARE
  rec RECORD;
  new_type_id UUID;
BEGIN
  FOR rec IN 
    SELECT DISTINCT challenge_type 
    FROM challenge_pricing 
    WHERE challenge_type_id IS NULL
  LOOP
    -- Check if type exists
    SELECT id INTO new_type_id 
    FROM challenge_types 
    WHERE type_name = rec.challenge_type;
    
    -- If not, create it
    IF new_type_id IS NULL THEN
      INSERT INTO challenge_types (
        type_name, 
        display_name, 
        description, 
        phase_count, 
        is_active,
        recommended,
        icon,
        color
      ) VALUES (
        rec.challenge_type,
        INITCAP(REPLACE(rec.challenge_type, '_', ' ')) || ' Challenge',
        'Challenge type: ' || rec.challenge_type,
        2,
        true,
        false,
        'star',
        'gray'
      )
      RETURNING id INTO new_type_id;
    END IF;
    
    -- Update pricing records
    UPDATE challenge_pricing
    SET challenge_type_id = new_type_id
    WHERE challenge_type = rec.challenge_type
    AND challenge_type_id IS NULL;
  END LOOP;
END $$;

-- Create index on challenge_type_id
CREATE INDEX IF NOT EXISTS idx_challenge_pricing_type_id ON challenge_pricing(challenge_type_id);

-- ============================================================
-- ENSURE ALL CHALLENGE TYPES EXIST
-- ============================================================

-- Insert or update all expected challenge types
INSERT INTO challenge_types (
  type_name, 
  display_name, 
  description, 
  phase_count, 
  is_active,
  recommended,
  icon,
  color,
  phase1_profit_target,
  phase2_profit_target
) VALUES
  ('standard', 'Classic 2-Step', 'Traditional 2-phase evaluation with balanced rules', 2, true, true, 'trophy', 'blue', 8.00, 5.00),
  ('rapid', 'Rapid Fire', 'Fast-paced 1-step challenge for quick profit targets', 1, true, false, 'zap', 'orange', 10.00, NULL),
  ('professional', 'Pay-to-Go 2-Step', 'Pay for each phase separately as you progress', 2, true, false, 'credit-card', 'green', 8.00, 5.00),
  ('swing', 'Aggressive 2-Step', 'Higher profit targets with more aggressive rules', 2, true, false, 'flame', 'red', 10.00, 5.00),
  ('scaling', 'Scaling Plan', 'Scale your account size as you prove consistency', 2, true, false, 'trending-up', 'purple', 8.00, 5.00),
  ('elite', 'Elite Challenge', 'Premium challenge with enhanced features', 2, true, false, 'award', 'gold', 8.00, 5.00)
ON CONFLICT (type_name) 
DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  phase_count = EXCLUDED.phase_count,
  recommended = EXCLUDED.recommended,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  phase1_profit_target = EXCLUDED.phase1_profit_target,
  phase2_profit_target = EXCLUDED.phase2_profit_target,
  updated_at = NOW();

-- ============================================================
-- ENSURE PRICING DATA FOR ALL CHALLENGE TYPES
-- ============================================================

-- Function to ensure pricing exists for a challenge type
CREATE OR REPLACE FUNCTION ensure_challenge_pricing(
  p_type_name TEXT,
  p_account_size NUMERIC,
  p_regular_price NUMERIC,
  p_discount_price NUMERIC,
  p_platform_cost NUMERIC DEFAULT 0,
  p_daily_dd_pct NUMERIC DEFAULT 5.00,
  p_max_dd_pct NUMERIC DEFAULT 10.00,
  p_min_trading_days INTEGER DEFAULT 4,
  p_time_limit_days INTEGER DEFAULT 60
) RETURNS VOID AS $$
DECLARE
  v_type_id UUID;
BEGIN
  -- Get the challenge type ID
  SELECT id INTO v_type_id FROM challenge_types WHERE type_name = p_type_name;
  
  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'Challenge type % not found', p_type_name;
  END IF;

  -- Insert or update pricing
  INSERT INTO challenge_pricing (
    challenge_type,
    challenge_type_id,
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
    p_type_name,
    v_type_id,
    p_account_size,
    p_regular_price,
    p_discount_price,
    p_regular_price,
    p_discount_price,
    p_platform_cost,
    p_daily_dd_pct,
    p_max_dd_pct,
    p_min_trading_days,
    p_time_limit_days,
    true
  )
  ON CONFLICT (challenge_type, account_size)
  DO UPDATE SET
    challenge_type_id = EXCLUDED.challenge_type_id,
    phase_1_price = EXCLUDED.phase_1_price,
    phase_2_price = EXCLUDED.phase_2_price,
    regular_price = EXCLUDED.regular_price,
    discount_price = EXCLUDED.discount_price,
    platform_cost = EXCLUDED.platform_cost,
    daily_dd_pct = EXCLUDED.daily_dd_pct,
    max_dd_pct = EXCLUDED.max_dd_pct,
    min_trading_days = EXCLUDED.min_trading_days,
    time_limit_days = EXCLUDED.time_limit_days,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Ensure pricing for all challenge types
-- Standard/Classic 2-Step
SELECT ensure_challenge_pricing('standard', 5000, 49.00, 29.00, 10.00, 5.00, 10.00, 4, 60);
SELECT ensure_challenge_pricing('standard', 10000, 99.00, 49.00, 15.00, 5.00, 10.00, 4, 60);
SELECT ensure_challenge_pricing('standard', 25000, 199.00, 99.00, 25.00, 5.00, 10.00, 4, 60);
SELECT ensure_challenge_pricing('standard', 50000, 299.00, 149.00, 35.00, 5.00, 10.00, 4, 60);
SELECT ensure_challenge_pricing('standard', 100000, 499.00, 249.00, 50.00, 5.00, 10.00, 4, 60);
SELECT ensure_challenge_pricing('standard', 200000, 899.00, 449.00, 75.00, 5.00, 10.00, 4, 60);

-- Rapid Fire
SELECT ensure_challenge_pricing('rapid', 5000, 69.00, 39.00, 12.00, 5.00, 10.00, 3, 30);
SELECT ensure_challenge_pricing('rapid', 10000, 119.00, 69.00, 18.00, 5.00, 10.00, 3, 30);
SELECT ensure_challenge_pricing('rapid', 25000, 229.00, 129.00, 30.00, 5.00, 10.00, 3, 30);
SELECT ensure_challenge_pricing('rapid', 50000, 349.00, 199.00, 45.00, 5.00, 10.00, 3, 30);
SELECT ensure_challenge_pricing('rapid', 100000, 579.00, 329.00, 65.00, 5.00, 10.00, 3, 30);
SELECT ensure_challenge_pricing('rapid', 200000, 999.00, 569.00, 95.00, 5.00, 10.00, 3, 30);

-- Professional/Pay-to-Go
SELECT ensure_challenge_pricing('professional', 5000, 39.00, 29.00, 8.00, 5.00, 10.00, 4, 60);
SELECT ensure_challenge_pricing('professional', 10000, 79.00, 59.00, 12.00, 5.00, 10.00, 4, 60);
SELECT ensure_challenge_pricing('professional', 25000, 159.00, 119.00, 20.00, 5.00, 10.00, 4, 60);
SELECT ensure_challenge_pricing('professional', 50000, 239.00, 179.00, 28.00, 5.00, 10.00, 4, 60);
SELECT ensure_challenge_pricing('professional', 100000, 399.00, 299.00, 40.00, 5.00, 10.00, 4, 60);
SELECT ensure_challenge_pricing('professional', 200000, 719.00, 539.00, 60.00, 5.00, 10.00, 4, 60);

-- Aggressive/Swing
SELECT ensure_challenge_pricing('swing', 5000, 59.00, 39.00, 10.00, 5.00, 10.00, 4, 90);
SELECT ensure_challenge_pricing('swing', 10000, 109.00, 69.00, 15.00, 5.00, 10.00, 4, 90);
SELECT ensure_challenge_pricing('swing', 25000, 219.00, 139.00, 25.00, 5.00, 10.00, 4, 90);
SELECT ensure_challenge_pricing('swing', 50000, 329.00, 209.00, 35.00, 5.00, 10.00, 4, 90);
SELECT ensure_challenge_pricing('swing', 100000, 549.00, 349.00, 50.00, 5.00, 10.00, 4, 90);
SELECT ensure_challenge_pricing('swing', 200000, 989.00, 629.00, 75.00, 5.00, 10.00, 4, 90);

-- Clean up function
DROP FUNCTION IF EXISTS ensure_challenge_pricing;