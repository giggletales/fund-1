/*
  # Fix Challenge Types Column Names to Match Frontend Expectations

  Add columns that the frontend expects:
  - challenge_code (maps from type_name)
  - challenge_name (maps from display_name)
  
  Keep backward compatibility by maintaining both column sets
*/

-- Add challenge_code as a copy of type_name
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_types' AND column_name = 'challenge_code') THEN
    ALTER TABLE challenge_types ADD COLUMN challenge_code TEXT;
  END IF;
END $$;

-- Add challenge_name as a copy of display_name  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'challenge_types' AND column_name = 'challenge_name') THEN
    ALTER TABLE challenge_types ADD COLUMN challenge_name TEXT;
  END IF;
END $$;

-- Copy data to new columns (converting type_name to uppercase code format)
UPDATE challenge_types
SET 
  challenge_code = UPPER(REPLACE(type_name, '-', '_')),
  challenge_name = display_name
WHERE challenge_code IS NULL OR challenge_name IS NULL;

-- Update specific types to match expected codes
UPDATE challenge_types SET challenge_code = 'CLASSIC_2STEP' WHERE type_name = 'standard';
UPDATE challenge_types SET challenge_code = 'RAPID_FIRE' WHERE type_name = 'rapid';
UPDATE challenge_types SET challenge_code = 'PAYG_2STEP' WHERE type_name = 'professional';
UPDATE challenge_types SET challenge_code = 'AGGRESSIVE_2STEP' WHERE type_name = 'swing';
UPDATE challenge_types SET challenge_code = 'SWING_PRO' WHERE type_name = 'scaling';
UPDATE challenge_types SET challenge_code = 'ELITE_ROYAL' WHERE type_name = 'elite_royal';
UPDATE challenge_types SET challenge_code = 'ELITE_ROYAL' WHERE type_name = 'elite';

-- Create index on challenge_code
CREATE INDEX IF NOT EXISTS idx_challenge_types_code ON challenge_types(challenge_code);

-- Create a view that provides all column variants for backward compatibility
CREATE OR REPLACE VIEW challenge_types_view AS
SELECT 
  id,
  type_name,
  display_name,
  description,
  phase_count,
  is_active,
  recommended,
  icon,
  color,
  phase1_profit_target,
  phase2_profit_target,
  created_at,
  updated_at,
  COALESCE(challenge_code, UPPER(REPLACE(type_name, '-', '_'))) as challenge_code,
  COALESCE(challenge_name, display_name) as challenge_name
FROM challenge_types;

GRANT SELECT ON challenge_types_view TO authenticated, anon;