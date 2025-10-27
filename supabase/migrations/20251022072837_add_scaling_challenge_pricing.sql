/*
  # Add Scaling Challenge Pricing

  Add pricing tiers for the Scaling Plan challenge type
*/

-- Get the scaling challenge type ID and add pricing
DO $$
DECLARE
  v_scaling_id UUID;
BEGIN
  -- Get scaling challenge type ID
  SELECT id INTO v_scaling_id FROM challenge_types WHERE type_name = 'scaling';
  
  IF v_scaling_id IS NOT NULL THEN
    -- Insert pricing for scaling challenges
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
    ) VALUES
      ('scaling', v_scaling_id, 5000, 59.00, 39.00, 59.00, 39.00, 10.00, 5.00, 10.00, 4, 90, true),
      ('scaling', v_scaling_id, 10000, 109.00, 69.00, 109.00, 69.00, 15.00, 5.00, 10.00, 4, 90, true),
      ('scaling', v_scaling_id, 25000, 219.00, 139.00, 219.00, 139.00, 25.00, 5.00, 10.00, 4, 90, true),
      ('scaling', v_scaling_id, 50000, 329.00, 209.00, 329.00, 209.00, 35.00, 5.00, 10.00, 4, 90, true),
      ('scaling', v_scaling_id, 100000, 549.00, 349.00, 549.00, 349.00, 50.00, 5.00, 10.00, 4, 90, true),
      ('scaling', v_scaling_id, 200000, 989.00, 629.00, 989.00, 629.00, 75.00, 5.00, 10.00, 4, 90, true)
    ON CONFLICT (challenge_type, account_size)
    DO UPDATE SET
      challenge_type_id = EXCLUDED.challenge_type_id,
      phase_1_price = EXCLUDED.phase_1_price,
      phase_2_price = EXCLUDED.phase_2_price,
      regular_price = EXCLUDED.regular_price,
      discount_price = EXCLUDED.discount_price,
      platform_cost = EXCLUDED.platform_cost,
      updated_at = NOW();
  END IF;
END $$;